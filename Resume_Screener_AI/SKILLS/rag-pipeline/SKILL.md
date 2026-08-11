---
name: rag-pipeline
description: >-
  Build a complete RAG system on Neon Postgres with pgvector, section-aware
  chunking, category filtering, Row-Level Security tenant isolation, HNSW and
  B-tree indexing, and professional retrieval+generation. Covers schema design,
  embedding workers, tenant isolation via RLS, index verification with EXPLAIN
  ANALYZE, and benchmark validation. Use when asked to build a RAG pipeline,
  vector search on Postgres, multi-tenant document search, or pgvector-based
  answering.
---

# RAG Pipeline on Neon Postgres — Complete Reference

A production-grade Retrieval-Augmented Generation pipeline built on Neon Serverless Postgres with pgvector. This skill covers every layer: infrastructure, schema, chunking, embedding, indexing, retrieval, generation, tenant isolation via RLS, and verification/benchmarking.

---

## Architecture Overview

```
Markdown docs → Section-aware chunker → Embedder (Gemini) → Neon (pgvector)
                                                                    ↓
Query → Embedder → [RLS-filtered] vector search (HNSW) → Generator → Answer
```

### Components

| Layer | Tool/Technology | Role |
|-------|----------------|------|
| Storage | Neon Postgres (branch) | ACID-compliant vector store |
| Extension | `pgvector` | Vector type + HNSW/IVFFlat + cosine/L2 distance |
| Chunking | Section-aware (`#`/`##` headings) | Semantically coherent chunks |
| Embedding | `gemini-embedding-2` (768 dims, MRL) | Dense vectors for all chunks |
| Retrieval | Cosine similarity via `<=>` operator | Top-k nearest chunks |
| Generation | `gemini-2.5-flash` | Context-grounded answer |
| Security | PostgreSQL RLS + role-based access | Tenant isolation at DB level |
| Indexing | HNSW on vector + B-tree on category | Fast retrieval + efficient filtering |

---

## Step 1: Infrastructure — Neon Project + Branch

### Create project and dev branch via MCP

```
Neon_create_project(name="my-rag-project")
Neon_create_branch(projectId, branchName="dev")
```

Get the dev branch connection string:

```
Neon_get_connection_string(projectId, branchId, databaseName="neondb")
```

Store the connection string in `.env` as `DATABASE_URL`.

### Enable pgvector

Run on the dev branch:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Verify:

```sql
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

**Important:** pgvector is installed per database, not per project. Run this in every database where vectors are stored.

---

## Step 2: Schema Design

### Documents table — source of truth

```sql
CREATE TABLE documents (
    id         BIGSERIAL PRIMARY KEY,
    filename   TEXT NOT NULL UNIQUE,
    content    TEXT NOT NULL,
    tenant     TEXT NOT NULL DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Chunks table — embedded, searchable pieces

```sql
CREATE TABLE chunks (
    id          BIGSERIAL PRIMARY KEY,
    doc_id      BIGINT REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    section     TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'general',
    tenant      TEXT NOT NULL DEFAULT 'default',
    content     TEXT NOT NULL,
    embedding   VECTOR(768) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);
```

**Why 768 dimensions?** Gemini Embedding 2 supports Matryoshka Representation Learning (MRL) — store at 768 for production (97%+ recall vs 3072 full). Saves 4× storage and 4× index memory.

### Indexes

```sql
-- HNSW for approximate nearest-neighbor cosine search
CREATE INDEX idx_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops);

-- B-tree for efficient category/tenant filtering before vector search
CREATE INDEX idx_chunks_category ON chunks (category);
CREATE INDEX idx_chunks_tenant ON chunks (tenant);

-- FK index for joins
CREATE INDEX idx_chunks_doc_id ON chunks (doc_id);
```

### Index selection guide

| Scenario | Index type | Build time | Query speed | Recall |
|----------|-----------|-----------|------------|--------|
| Small table (< 10k rows) | None (seq scan) | N/A | Fine | Exact |
| Medium (10k–500k) | HNSW | Moderate | Fast | ~99% |
| Large (> 500k) | IVFFlat | Fast | Good | ~95% |
| Filtered search | HNSW + B-tree on filter column | Moderate | Very fast | ~99% |

---

## Step 3: Section-Aware Chunking

**Common mistake:** Fixed-size character chunks split across section boundaries, producing semantically broken snippets.

**Correct approach:** Split on markdown headings (`#` and `##`). Each chunk is a complete section.

### Chunking algorithm (pseudocode)

```
1. Split document text by lines
2. Track current heading (starts as "__top__")
3. Accumulate lines under current heading
4. On encountering a new heading (line starts with "# " or "## "):
   a. If accumulated lines are non-empty, emit a chunk (heading + body)
   b. Reset heading and accumulator
5. After loop, emit final chunk
6. Drop empty chunks
```

### Guardrail — verify all chunks are non-empty

```python
assert all(chunk.strip() for chunk in chunks), "Empty chunk detected"
```

### Guardrail — verify chunks are below embedding model token limit

Gemini Embedding 2 accepts max 8192 tokens per input. For safety, cap chunks at ~500 characters.

---

## Step 4: Embedding Worker

### Embedding call pattern

```python
from google import genai

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

result = client.models.embed_content(
    model="gemini-embedding-2",
    contents=full_chunk_text,
    config={"output_dimensionality": 768},
)
vector = result.embeddings[0].values  # list[float], length 768
```

### Critical checks

1. **Each row gets a DISTINCT vector.** The most common bug is generating one vector and copying it to all rows. Always embed each chunk independently.
2. **Verify after loading:**
   ```sql
   SELECT COUNT(*) AS total, COUNT(DISTINCT embedding) AS distinct_vectors FROM chunks;
   -- These must be equal
   ```
3. **Handle embedding API errors with retry** (network blips are common).
4. **Batch size:** No batching needed for correctness — embedding API calls per chunk in a loop are fine for < 10k chunks.

---

## Step 5: Retrieval Function

### Base retrieval (no filter)

```sql
SELECT c.content, d.filename, c.section, c.category, c.tenant,
       1 - (c.embedding <=> %s::vector) AS similarity
FROM chunks c
JOIN documents d ON d.id = c.doc_id
ORDER BY c.embedding <=> %s::vector
LIMIT %s;
```

### Category-filtered retrieval

```sql
SELECT c.content, d.filename, c.section, c.category, c.tenant,
       1 - (c.embedding <=> %s::vector) AS similarity
FROM chunks c
JOIN documents d ON d.id = c.doc_id
WHERE c.category = %s
ORDER BY c.embedding <=> %s::vector
LIMIT %s;
```

### Tenant-filtered retrieval (RLS-protected)

If RLS is properly configured on the `chunks` table, simply filtering by `tenant` column in the query is redundant — RLS already enforces it. But including it in the query makes the intent explicit:

```sql
WHERE c.tenant = current_setting('app.current_tenant')
```

### Python retrieval function

```python
def retrieve(question, top_k=5, category=None, tenant=None):
    # 1. Embed question
    # 2. Build SQL with optional WHERE clauses for category/tenant
    # 3. Execute with params
    # 4. Return list of {"filename", "section", "category", "tenant", "content", "similarity"}
```

---

## Step 6: Answer Generation

```python
def answer_question(question, top_k=5, category=None):
    chunks = retrieve(question, top_k=top_k, category=category)
    if not chunks:
        return "No relevant information found."

    context = "\n\n---\n\n".join(
        f"[{r['filename']} / {r['section']} (score: {r['similarity']:.3f})]\n{r['content']}"
        for r in chunks
    )

    response = genai_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            f"Use ONLY the following context to answer. "
            f"If the context does not contain enough information, say so.\n\n"
            f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
        ],
    )
    return response.text
```

**Guardrail:** The prompt instructs the model to answer "using ONLY the context." This prevents hallucination.

---

## Step 7: Row-Level Security — Tenant Isolation

### Why RLS, not just application-level filtering?

Application-level filtering is easy to bypass with a bug. RLS is enforced at the database level — even direct SQL connections, admin tools, or compromised application code cannot leak another tenant's data.

### Role creation (via SQL, NOT hand-configured)

```sql
CREATE ROLE tenant_a WITH LOGIN PASSWORD '<strong-password>' NOINHERIT;
CREATE ROLE tenant_b WITH LOGIN PASSWORD '<strong-password>' NOINHERIT;
GRANT CONNECT ON DATABASE mydb TO tenant_a, tenant_b;
GRANT USAGE ON SCHEMA public TO tenant_a, tenant_b;
GRANT SELECT ON chunks TO tenant_a, tenant_b;
GRANT SELECT ON documents TO tenant_a, tenant_b;
```

### RLS policy

```sql
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON chunks FOR SELECT
  USING (
    tenant = CASE current_user
      WHEN 'tenant_a' THEN 'tenant_a'
      WHEN 'tenant_b' THEN 'tenant_b'
    END
  );

ALTER TABLE chunks FORCE ROW LEVEL SECURITY;
```

`FORCE ROW LEVEL SECURITY` ensures RLS is applied even to the table owner (superuser). This is critical — without `FORCE`, an owner role can bypass RLS in testing, giving false confidence.

### Testing RLS — use non-owner roles only

The table owner and superuser bypass RLS. To test:
1. Create a non-owner role with SELECT only
2. Connect as that role (NOT via `SET ROLE` from owner, because owner may still enforce RLS differently)
3. Run queries and verify cross-tenant data is excluded

### Verification query

```sql
-- As tenant_a: should see 0 tenant_b rows for any category
SELECT count(*) FROM chunks WHERE tenant = 'tenant_b';  -- must return 0

-- As tenant_b: should see 0 tenant_a rows
SELECT count(*) FROM chunks WHERE tenant = 'tenant_a';  -- must return 0
```

---

## Step 8: Benchmarking — Prove Index Wins

### Create throwaway benchmark branch

```
Neon_create_branch(projectId, branchName="benchmark-pgvector")
```

Create a synthetic benchmark table (no real text/embeddings needed):

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE benchmark (id BIGSERIAL PRIMARY KEY, vec VECTOR(128));
```

Populate with 100k–150k distinct random vectors (use `GROUP BY` to ensure each row is distinct):

```sql
INSERT INTO benchmark (vec)
SELECT array_agg(random() ORDER BY g)
FROM generate_series(1, 100000) AS id, LATERAL generate_series(1, 128) AS g
GROUP BY id;

-- CRITICAL CHECK: verify all vectors are distinct
SELECT COUNT(*) AS total, COUNT(DISTINCT vec) AS distinct_vectors FROM benchmark;
-- Both counts must match
```

### Without index — EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE
SELECT c.id, c.embedding <=> t.embedding AS distance
FROM benchmark c, (SELECT embedding FROM benchmark ORDER BY random() LIMIT 1) t
ORDER BY c.embedding <=> t.embedding LIMIT 10;
```

**Expected:** `Seq Scan` on benchmark, `Sort` with top-N heapsort, execution ~90ms+.

### Build HNSW index

Scale compute if needed (index builds are CPU-intensive), then:

```sql
BEGIN;
SET LOCAL maintenance_work_mem = '256MB';
CREATE INDEX ON benchmark USING hnsw (vec vector_cosine_ops);
COMMIT;
```

**Note:** If the index build times out on low-CU computes, scale up first using Neon CLI or API:

```bash
neon branches update <branch-id> --project <project-id> --autoscaling-limit-min-cu 1 --autoscaling-limit-max-cu 4
```

### With index — EXPLAIN ANALYZE (identical query)

```sql
EXPLAIN ANALYZE
SELECT c.id, c.embedding <=> t.embedding AS distance
FROM benchmark c, (SELECT embedding FROM benchmark ORDER BY random() LIMIT 1) t
ORDER BY c.embedding <=> t.embedding LIMIT 10;
```

**Expected:** `Index Scan using idx_benchmark_vec on benchmark`, execution <5ms.

### Compare side by side

| Metric | Before index | After HNSW index |
|--------|-------------|-----------------|
| Scan type | Seq Scan | Index Scan (hnsw) |
| Plan cost | ~30,671 | ~2–5 |
| Execution time | ~93ms | ~1–3ms |
| Rows scanned | 100,000 (all) | ~100 (top candidates) |

### Varying `ef_search`

```sql
-- Low ef_search: faster, lower recall
SET hnsw.ef_search = 40;
EXPLAIN ANALYZE <same query>;

-- Medium ef_search: balanced
SET hnsw.ef_search = 100;
EXPLAIN ANALYZE <same query>;

-- High ef_search: slower, near-exact recall
SET hnsw.ef_search = 200;
EXPLAIN ANALYZE <same query>;
```

**Observed pattern:** Latency increases with `ef_search` but recall improves. For most production workloads, `ef_search = 100` is the sweet spot.

### Cleanup

```
Neon_delete_branch(branchId="benchmark-pgvector", projectId)
```

---

## Step 9: Complete File Structure

```
project/
├── .env                          # DATABASE_URL + GEMINI_API_KEY
├── pyproject.toml                # uv-managed project
├── load_docs.py                  # Section-aware chunker + embedder worker
├── retrieve.py                   # retrieve(question, top_k, category) function
├── rag.py                        # answer_question(question, top_k, category) function
├── demo.py                       # End-to-end demo with 5+ questions
├── docs/                         # Source markdown documents
└── .claude/skills/               # Claude skills (rag-pipeline, neon-postgres, etc.)
```

---

## Complete Execution Order

1. **Infra:** `Neon_create_project` → `Neon_create_branch` → get connection string → write `.env`
2. **Schema:** `CREATE EXTENSION IF NOT EXISTS vector;` → create `documents` + `chunks` tables → create HNSW + B-tree indexes
3. **Chunk & embed:** `python load_docs.py` — reads `./docs/*.md`, splits by section, embeds each chunk, inserts into Neon
4. **Verify:** `SELECT COUNT(*), COUNT(DISTINCT embedding) FROM chunks;` — counts must match
5. **Test retrieval:** Run 3–5 representative questions, inspect retrieved chunks
6. **Test RLS:** Create tenant roles → connect as each → verify cross-tenant isolation
7. **Benchmark (optional):** Create benchmark branch → synthetic data → EXPLAIN ANALYZE before/after index → delete branch
8. **Cleanup:** Delete benchmark branch to reclaim storage

---

## Critical Guardrails Summary

| Check | Why it matters | How |
|-------|---------------|-----|
| Distinct embeddings | Common bug: same vector for every row | `COUNT(DISTINCT embedding) = COUNT(*)` |
| Section-aware chunking | Fixed-size chunks produce incoherent snippets | Split on `#`/`##` markdown headings |
| Section column in chunks | Attribution: which section did this chunk come from? | Extract heading text during chunking |
| HNSW index on vector | Without it, retrieval is seq scan = slow at scale | `CREATE INDEX ... USING hnsw (embedding vector_cosine_ops)` |
| B-tree on filter columns | Category/tenant filtering before vector search is fast with B-tree | `CREATE INDEX ON chunks (category)` |
| `FORCE ROW LEVEL SECURITY` | Without it, owner/superuser can bypass RLS in testing | `ALTER TABLE chunks FORCE ROW LEVEL SECURITY` |
| Non-owner role testing | Owner bypasses RLS, giving false confidence | Create dedicated `tester_*` roles with SELECT only |
| `FORCE ROW LEVEL SECURITY` | Ensures RLS applies to all roles including owner | Always enable FORCE RLS in production |
| `maintenance_work_mem` for index builds | HNSW index build on low-CU compute times out | `SET LOCAL maintenance_work_mem = '256MB'` in transaction |
| Tenant isolation at DB level | App-level filtering is easy to bypass | PostgreSQL RLS enforced at connection level |