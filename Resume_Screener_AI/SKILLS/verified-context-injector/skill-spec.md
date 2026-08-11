## Intent

**What customer problem does this skill solve?**

AI-powered businesses need accurate and relevant contextual data before generating responses, but current workflows often retrieve excessive, irrelevant, or low-quality information that increases token usage, slows reasoning, and reduces output accuracy. This skill intelligently fetches precise, context-aware data using the Context7 MCP server, ensuring models receive only the most relevant information needed for the task. This enables teams to improve response quality, reduce hallucinations, optimize token consumption, and build more reliable AI systems.

**Example:**
Sales teams need to identify which accounts are growing vs stagnating to prioritize outreach. Currently, managers spend 4-6 hours weekly manually reviewing spreadsheets. This skill analyzes customer transaction history, flags trends, and generates weekly reports in 5 minutes, freeing managers for strategy.

**Why customers would buy:**
- Time saved: Reduces manual verification and repeated prompting during AI workflows
- Cost reduction: Decreases unnecessary token consumption by minimizing irrelevant context retrieval
- Risk reduced: Reduces hallucinations, outdated responses, and inaccurate outputs
- Performance improvement: Improves response accuracy, grounding quality, and reliability of AI agents and automated systems
- Scalability: Enables consistent retrieval workflows across multiple AI agents and enterprise systems


## Success Criteria

- Accuracy: Retrieves highly relevant contextual data with minimal irrelevant information, achieving 90%+ relevance precision on tested prompts
- Speed: Fetches and injects contextual documentation within 3–10 seconds for standard retrieval workflows
- Reliability: Successfully handles 95%+ of supported retrieval requests without workflow failure or invalid context injection
- Completeness: Retrieves all critical contextual information required for the requested task, including framework references, API documentation, and implementation details
- Safety: Flags uncertain, incomplete, outdated, or low-confidence retrieval results before generation to reduce hallucinated outputs
- Integration: Works seamlessly with Context7 MCP workflows and supports integration into agentic AI systems, coding assistants, RAG pipelines, and automation workflows
- Learning: Generates structured retrieval logs and failed-query traces to continuously improve retrieval quality and context-filtering strategies

## Constraints (Non-Goals)

- Does NOT: Generate final business decisions or authoritative conclusions
Why: The skill is designed for accurate context retrieval and grounding, not autonomous decision-making
- Does NOT: Modify or overwrite external source data
Why: The system operates as a read-only retrieval and context injection layer for safety and reliability
- Does NOT: Retrieve unnecessary large-scale context dumps or unrelated documentation
Why: Excessive context increases token usage, slows reasoning, and degrades output quality
- Does NOT: Guarantee legal, financial, medical, or regulatory correctness without human validation
Why: Retrieved context improves grounding, but domain experts are still responsible for final verification
- Does NOT: Replace full RAG infrastructure or vector databases
Why: This skill focuses on intelligent retrieval orchestration using Context7 MCP rather than persistent knowledge storage
- Does NOT: Automatically trust every retrieved source without relevance filtering
Why: Retrieved information must still be validated for contextual relevance and accuracy before generation
- Does NOT: Handle unsupported or unavailable external sources outside configured MCP capabilities
Why: Retrieval quality depends on available MCP integrations and accessible documentation sources


# Acceptance Tests

## Test 1: Accurate Context Retrieval
**Input:**  
User asks for latest Next.js middleware authentication implementation using Context7 MCP

**Expected:**  
Skill retrieves only relevant and up-to-date Next.js authentication and middleware documentation without unrelated framework data

**Pass/Fail Criteria:**  
- Retrieved context relevance score ≥ 90%
- No unrelated documentation included
- Output uses latest documented syntax and APIs

---

## Test 2: Robustness to Incomplete Queries
**Input:**  
User provides vague request such as “setup auth middleware”

**Expected:**  
Skill intelligently identifies missing context (framework/version) and either:
- infers probable context safely, or
- requests clarification before retrieval

**Pass/Fail Criteria:**  
- No hallucinated framework assumptions
- Clarification requested when confidence is low
- Retrieval process does not fail on incomplete prompts

---

## Test 3: Performance at Scale
**Input:**  
100 sequential retrieval requests across multiple frameworks and APIs

**Expected:**  
Skill performs retrieval, filtering, and grounding efficiently without excessive latency or token inflation

**Pass/Fail Criteria:**  
- Average retrieval workflow completes within acceptable response window (3–10 seconds typical)
- Context payload remains optimized and relevant
- No retrieval crashes during batch execution

---

## Test 4: Integration with Context7 MCP
**Input:**  
Real-world framework request requiring Context7 documentation retrieval

**Expected:**  
Skill successfully calls Context7 MCP tools, resolves library identifiers, fetches relevant documentation, and injects grounded context into generation flow

**Pass/Fail Criteria:**  
- MCP tool calls execute successfully
- Retrieved documentation matches requested technology/domain
- No schema or formatting failures occur during retrieval

---

## Test 5: Error Recovery and Fallback Handling
**Input:**  
Invalid library name, unavailable source, or failed MCP retrieval

**Expected:**  
Skill detects retrieval failure, explains issue clearly, suggests alternatives or clarification, and safely recovers without breaking the workflow

**Pass/Fail Criteria:**  
- Retrieval failure handled gracefully
- User receives actionable recovery guidance
- Workflow continues without requiring full restart

# Architecture

## Component 1: Context Retrieval Layer (MCP Wrapping)

- **Which MCP?** Context7 MCP server
- **Skill wrapping it:** `verified-context-injector`
- **What it does:**  
  Detects required knowledge domain, resolves library/source identifiers, retrieves accurate and relevant contextual documentation, filters noisy data, and prepares optimized grounding context

---

## Component 2: Context Validation & Filtering Layer

- **Validation System:** Internal filtering and relevance validation workflow
- **Controlled by:** `verified-context-injector`
- **What it does:**  
  Validates retrieved context relevance, removes redundant or low-signal information, prioritizes authoritative references, and ensures token-efficient context injection

---

## Component 3: Workflow Coordination Layer (Orchestration)

- **Master skill:** `verified-context-injector`
- **Coordination:**  
  Detects user intent → calls Context7 MCP → validates retrieved context → injects optimized grounded information into generation workflow

- **Error recovery:**  
  If retrieval quality is low or MCP calls fail, the skill:
  - retries retrieval with narrower constraints
  - requests clarification
  - or falls back to safe minimal-context generation

---

# Phase 2: Skill Composition

## Skill Composition Strategy

The `verified-context-injector` skill is designed as a unified retrieval and grounding workflow that combines:

- Context detection
- Context7 MCP retrieval
- Relevance validation
- Context filtering
- Grounded context injection
- Error recovery

Rather than splitting these into multiple independent skills, version 1 centralizes orchestration inside a single intelligent retrieval skill for simplicity, reliability, and easier maintenance.

---

# Internal Workflow Components

## Component 1: Knowledge Detection Layer

### Responsibility

Analyzes the user request to determine:
- domain
- framework/library
- retrieval intent
- required context scope

### Example

User Input:

```txt
Create authentication middleware in Next.js
```

Detection Output:

```json
{
  "domain": "Next.js",
  "intent": "authentication middleware",
  "retrieval_required": true
}
```

---

## Component 2: Context7 MCP Retrieval Layer

### Responsibility

Uses Context7 MCP tools to:
- resolve library identifiers
- fetch official documentation
- retrieve latest implementation patterns
- minimize irrelevant context

### MCP Dependency

- Context7 MCP server

### Example Workflow

```txt
resolve-library-id("nextjs")
↓
query-docs("/vercel/next.js")
```

---

## Component 3: Context Validation & Filtering Layer

### Responsibility

Validates retrieved context before injection by:
- removing noisy/unrelated information
- prioritizing authoritative references
- reducing token-heavy redundant context
- ensuring grounding quality

### Output Goals

- High relevance
- Minimal token waste
- Reduced hallucination risk

---

## Component 4: Grounded Context Injection Layer

### Responsibility

Injects validated contextual information into the Claude reasoning workflow before response generation begins.

### Goal

Ensure generated outputs are:
- accurate
- context-aware
- retrieval-grounded
- aligned with latest documentation

---

# Data Contracts

## Retrieval Input Contract

Input:

```json
{
  "query": "Create Next.js auth middleware",
  "domain": "Next.js",
  "intent": "authentication",
  "retrieval_required": true
}
```

Output:

```json
{
  "sources": ["official_docs"],
  "retrieved_context": [...],
  "validation_passed": true,
  "confidence_score": 0.92
}
```

---

## Validation Layer Contract

Input:

```json
{
  "retrieved_context": [...],
  "source_quality": "official",
  "token_budget": 4000
}
```

Output:

```json
{
  "filtered_context": [...],
  "removed_noise": true,
  "optimized_for_generation": true
}
```

---

# Error Recovery Strategy

## If Context7 MCP Retrieval Fails

### Recovery Flow

- Retry retrieval with narrower query scope
- Retry using alternative library identifiers
- Request clarification from user if ambiguity exists
- Fall back to minimal safe generation if retrieval remains unavailable

### Goal

Prevent hallucinated outputs caused by missing grounding context.

---

## If Retrieved Context Is Low Quality

### Recovery Flow

- Remove unrelated documentation
- Re-rank sources by relevance
- Reduce context size
- Request more specific user intent if needed

### Goal

Prevent token waste and noisy reasoning.

---

## If Ambiguous Intent Is Detected

### Example

User Input:

```txt
Setup middleware
```

### Recovery Flow

- Ask framework clarification
- Detect probable domain safely
- Avoid unsupported assumptions

### Goal

Maintain retrieval accuracy and reduce incorrect grounding.

---

# Acceptance Tests

## Test 1: Accurate Context Retrieval

### Input

User asks for latest Next.js middleware authentication implementation using Context7 MCP

### Expected

Skill retrieves only relevant and up-to-date Next.js authentication and middleware documentation without unrelated framework data

### Pass/Fail Criteria

- Retrieved context relevance score ≥ 90%
- No unrelated documentation included
- Output uses latest documented syntax and APIs

---

## Test 2: Robustness to Incomplete Queries

### Input

User provides vague request such as:

```txt
setup auth middleware
```

### Expected

Skill intelligently identifies missing context (framework/version) and either:
- infers probable context safely
- or requests clarification before retrieval

### Pass/Fail Criteria

- No hallucinated framework assumptions
- Clarification requested when confidence is low
- Retrieval process does not fail on incomplete prompts

---

## Test 3: Performance at Scale

### Input

100 sequential retrieval requests across multiple frameworks and APIs

### Expected

Skill performs retrieval, filtering, and grounding efficiently without excessive latency or token inflation

### Pass/Fail Criteria

- Average retrieval workflow completes within acceptable response window (3–10 seconds typical)
- Context payload remains optimized and relevant
- No retrieval crashes during batch execution

---

## Test 4: Integration with Context7 MCP

### Input

Real-world framework request requiring Context7 documentation retrieval

### Expected

Skill successfully calls Context7 MCP tools, resolves library identifiers, fetches relevant documentation, and injects grounded context into generation flow

### Pass/Fail Criteria

- MCP tool calls execute successfully
- Retrieved documentation matches requested technology/domain
- No schema or formatting failures occur during retrieval

---

## Test 5: Error Recovery and Fallback Handling

### Input

Invalid library name, unavailable source, or failed MCP retrieval

### Expected

Skill detects retrieval failure, explains issue clearly, suggests alternatives or clarification, and safely recovers without breaking the workflow

### Pass/Fail Criteria

- Retrieval failure handled gracefully
- User receives actionable recovery guidance
- Workflow continues without requiring full restart

---

# Architecture

## Component 1: Context Retrieval Layer (MCP Wrapping)

### Which MCP?

- Context7 MCP server

### Skill Wrapping It

- `verified-context-injector`

### What It Does

- Detects required knowledge domain
- Resolves library/source identifiers
- Retrieves accurate and relevant contextual documentation
- Filters noisy data
- Prepares optimized grounding context

---

## Component 2: Context Validation & Filtering Layer

### Validation System

Internal filtering and relevance validation workflow

### Controlled By

- `verified-context-injector`

### What It Does

- Validates retrieved context relevance
- Removes redundant or low-signal information
- Prioritizes authoritative references
- Ensures token-efficient context injection

---

## Component 3: Workflow Coordination Layer (Orchestration)

### Master Skill

- `verified-context-injector`

### Coordination

Detects user intent → calls Context7 MCP → validates retrieved context → injects optimized grounded information into generation workflow

### Error Recovery

If retrieval quality is low or MCP calls fail, the skill:
- retries retrieval with narrower constraints
- requests clarification
- or falls back to safe minimal-context generation

---

# Data Flow

```txt
User Request
      ↓
Knowledge Detection
      ↓
Context7 MCP Retrieval
      ↓
Context Validation & Filtering
      ↓
Grounded Context Injection
      ↓
Claude Generation Layer
      ↓
Accurate Optimized Output
```