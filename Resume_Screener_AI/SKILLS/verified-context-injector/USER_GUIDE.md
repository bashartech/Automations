# Verified Context Injector - User Guide

## What This Does

Verified Context Injector is an intelligent retrieval and grounding skill designed to improve AI response accuracy by fetching highly relevant contextual information using Context7 MCP before generation begins.

Instead of relying purely on model memory, the skill retrieves official and context-aware documentation, filters noisy or irrelevant information, and injects optimized grounded context into the reasoning workflow. This helps reduce hallucinations, improve implementation accuracy, and optimize token usage.

---

# What You Need

## Required MCP

- Context7 MCP server configured and available

---

## Supported Input Types

The skill works best with requests involving:

- Framework implementation
- API integration
- SDK usage
- Middleware setup
- Technical architecture
- Configuration workflows
- Documentation-dependent implementation

---

## Example Supported Technologies

- Next.js
- React
- TypeScript
- Node.js
- Prisma
- Tailwind CSS
- Supabase
- OpenAI SDK
- Vercel AI SDK
- Express.js

---

## Recommended Usage

The skill works best when:
- the framework/library is clearly specified
- the implementation goal is explicit
- the request contains enough technical context

---

# How to Use It

## Step 1: Provide a Clear Technical Request

Example:

```txt
Create authentication middleware in Next.js 15 using JWT
```

---

## Step 2: Let the Skill Retrieve Context

The skill will automatically:
- detect the framework/domain
- determine retrieval requirements
- call Context7 MCP
- retrieve relevant documentation
- filter noisy context
- inject grounded references

---

## Step 3: Receive Grounded Output

The generated output will:
- align with retrieved documentation
- reduce hallucinated APIs
- prioritize latest implementation patterns
- optimize contextual relevance

---

# Understanding Results

## Grounded Responses

Generated outputs are based on:
- retrieved contextual documentation
- official framework references
- validated implementation patterns

---

## Context Optimization

The skill attempts to:
- minimize irrelevant context
- reduce token-heavy retrievals
- prioritize authoritative references
- improve signal-to-noise ratio

---

## Clarification Requests

If the request is ambiguous, the skill may ask follow-up questions before retrieval begins.

Example:

```txt
Setup middleware
```

Possible clarification:

```txt
Which framework are you using? Next.js, Express, Fastify, or another framework?
```

---

# Example Workflow

## User Request

```txt
Build Prisma authentication middleware for Next.js
```

---

## Internal Workflow

```txt
1. Detect framework and implementation intent
2. Use Context7 MCP retrieval
3. Fetch Prisma and Next.js documentation
4. Filter noisy context
5. Inject grounded references
6. Generate implementation output
```

---

## Final Result

- Reduced hallucinations
- Accurate implementation guidance
- Optimized token usage
- Retrieval-grounded output

---

# Troubleshooting

## Problem: Retrieval Feels Too Broad

### Cause

The request may be missing:
- framework version
- implementation scope
- target technology

### Solution

Provide more specific prompts.

Example:

```txt
Create Next.js 15 authentication middleware using JWT and Prisma
```

---

## Problem: Incorrect Framework Assumptions

### Cause

The original request may be ambiguous.

### Solution

Explicitly specify:
- framework
- library
- version
- integration target

---

## Problem: MCP Retrieval Failure

### Cause

Possible reasons:
- Context7 MCP unavailable
- invalid library identifier
- network issue
- unsupported technology

### Solution

- retry request
- simplify query
- verify MCP availability
- clarify framework name

---

## Problem: Too Much Context Retrieved

### Cause

Broad prompts may trigger excessive retrieval.

### Solution

Use narrower implementation-focused prompts.

Example:

```txt
Create JWT middleware in Next.js
```

instead of:

```txt
Teach me everything about authentication
```

---

# Limitations

The skill does NOT:
- guarantee legal or production correctness
- replace human code review
- replace full RAG infrastructure
- support unavailable MCP sources
- guarantee compatibility with undocumented APIs

The skill improves grounding quality but final implementation validation remains the developer's responsibility.

---

# Best Practices

For best results:

- specify framework names clearly
- include version information when relevant
- use implementation-focused prompts
- avoid overly broad requests
- prefer specific technical goals

---

# Support

## Recommended Maintenance

- Keep Context7 MCP updated
- Review retrieval quality periodically
- Validate generated implementations before production use

---

## Suggested Future Improvements

Potential future enhancements:
- multi-MCP orchestration
- retrieval caching
- vector-based relevance scoring
- automated grounding evaluation
- hallucination benchmarking
- retrieval telemetry analysis

---

# System Philosophy

Verified Context Injector follows the principle:

```txt
Reliable generation depends on reliable retrieval.
```

The goal is not retrieving more information.

The goal is retrieving the RIGHT information with:
- high relevance
- minimal noise
- optimized grounding
- reduced hallucinations
- efficient token usage