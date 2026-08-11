---
name: connector-native-app-builder
description: Build a complete connector-native MCP gateway — one FastMCP server with OAuth, session-gated tools, Neon Postgres state store, and a cloudflared tunnel for live testing. Covers architecture, four invariants, build order, code structure, and deployment. Use when asked to build a "connector-native app", "MCP gateway", "remote MCP server with tools", or "Claude connector."
---

# Connector-Native App Builder

Build a single remote MCP server (a "gateway") that a free-tier Claude user adds with one
connector URL and one Authorize click. The user's chat app brings the model and the loop;
this server brings tools, state, and identity. **There is no agent loop in this project.**

## Architecture

```
┌─────────────────────────────────────────────┐
│          claude.ai (the chat app)            │
│  ┌─ model ─┐  ┌─ agent loop (built-in) ─┐   │
│  │          │  │                          │   │
│  └──────────┘  └──────────────────────────┘   │
└──────────────────┬────────────────────────────┘
                   │ one connector URL
                   ▼
┌─────────────────────────────────────────────┐
│           FastMCP Gateway (port 8000)        │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ OAuth    │ │ Session  │ │ Tools        │ │
│  │ (401 if  │ │ (gate on │ │ domain_*     │ │
│  │ no token)│ │ every    │ │ user_*       │ │
│  │          │ │ tool)    │ │ config_*     │ │
│  └──────────┘ └──────────┘ └──────┬───────┘ │
└────────────────────────────────────┼─────────┘
                                     │
                        ┌────────────┴────────────┐
                        │   Neon Postgres          │
                        │   users / user_state     │
                        │   (cross-chat memory)    │
                        └─────────────────────────┘
```

### The Four Invariants (hard rules — never break)

1. **One gateway.** One MCP server, one public URL. Group tools by `domain_*`, `user_*`, `config_*` prefix. Never split into multiple connectors — a free user can add only one.
2. **Tools only.** Expose MCP **tools**. Do **not** use MCP resources or prompts for app logic.
3. **Prove, don't trust.** Identity comes only from the verified OAuth token's `sub` claim. **Never** read a user identifier from a tool argument. If a tool signature contains a `user_id`, ignore it and use `sub`.
4. **Fail closed.** If `begin_session` is unavailable or any tool errors, the server must make the model say the session can't continue. Never improvise content or invent user state.

## Prerequisites

- Python 3.14+ with `uv` (https://docs.astral.sh/uv/)
- A Neon Postgres project (free at neon.com)
- cloudflared (for Part 5 live tunnel)

## Build Order

Build each piece in sequence. Each concept is verified before moving to the next.

### Concept 4 — Gateway shell + health tool

**Build:** Create `src/connector_app/server.py`:
```
uv add fastmcp
```
A FastMCP server with streamable HTTP transport on `127.0.0.1:8000/mcp`. One `health` tool.

**Package:** `fastmcp` (latest), `python-dotenv`, `uv`

**Key file structure:**
```
src/connector_app/
  server.py        # Entry point — FastMCP app + tools
  config_store.py  # Rules and persona (you build server.py)
  db.py            # Neon connection pool + query functions (Concept 5)
  auth.py          # OAuth token verification (ships complete — DO NOT REGENERATE)
  session.py       # Session token mint/verify (ships complete — DO NOT REGENERATE)
seed/
  articles.json    # Domain content (Concept 6)
tests/
  test_starter.py  # Offline auth/session tests (pass at setup)
mock_auth/         # Local dev OAuth mock (Beginner track)
  server.py
  jwks.json
```

### Concept 5 — Two-table store (Neon)

**Build:** Create `src/connector_app/db.py` and a Neon project. Two tables:
```sql
CREATE TABLE users (sub TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT now(), last_active_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE user_state (sub TEXT, key TEXT, value JSONB DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (sub, key));
```
Write `DATABASE_URL` to `.env`. Round-trip a row to verify.

**Packages:** `psycopg` (async), `psycopg_pool`

**On Windows:** Set `WindowsSelectorEventLoopPolicy()` before using psycopg.

### Concept 6 — domain_get_item

**Build:** A `domain_get_item(id)` tool that returns a seed article from `seed/articles.json`.

### Concept 8 — OAuth wiring

**Build:** Wire the given `auth.py` into the server:

```python
class _AuthPyVerifier(TokenVerifier):
    async def verify_token(self, token: str) -> AccessToken | None:
        try:
            claims = await asyncio.to_thread(auth.verified_claims, token)
        except auth.AuthError:
            return None
        exp = claims.get("exp")
        return AccessToken(
            token=token, client_id=claims.get("sub", "unknown"),
            scopes=[], expires_at=int(exp) if exp is not None else None,
            subject=claims.get("sub"), claims=claims,
        )

_auth_provider = RemoteAuthProvider(
    token_verifier=_verifier,
    authorization_servers=[AnyHttpUrl(auth.AUTH_ISSUER)],
    base_url=auth.RESOURCE_URL,
)
mcp = FastMCP("my_app", auth=_auth_provider)
```

The four checks happen in `auth.py`:
1. **Signature** — token signed by the AS (verified via its JWKS)
2. **Issuer** — `iss` matches the AS we trust
3. **Audience** — `aud` is THIS server (RFC 8707 audience binding)
4. **Expiry** — `exp` has not passed

Expose `/.well-known/oauth-protected-resource` (RFC 9728) for discovery.
Unauthenticated → 401. Valid token → resolves `sub`. Wrong audience → 401.

### Concept 10 — Session contract

**Build:** Three pieces work together:

1. **`begin_session` tool** — reads `sub` from OAuth token (or `DEV_SUB` with `AUTH_DISABLED`), calls `db.ensure_user()`, mints a session token via `session.new_session_token()`. Returns `{session, rules, persona, state}`.

2. **Session gate** — every `domain_*`/`user_*` tool requires a `session: str` argument. Verify it with `session.require_session()` and raise `ValueError` on failure (maps to MCP `isError`).

3. **Fail-closed enforcement** — wrap every DB call in try/except. If DB is unreachable, return an error message telling the model the session cannot continue. **Never let the model invent state.**

### Concept 11 — Config tools + fail-closed rules

**Build:** Two ungated tools:
- `config_get_rules` — returns operational rules (format, fail_closed, cooperation)
- `config_get_persona` — returns the app's persona (name, voice, greeting)

The fail-closed rule must be cooperative ("here is how to behave for this user"), not an override ("ignore previous instructions") — override phrasing gets discounted by injection defenses.

### Concept 12 — Live deployment

**Build:** Set `AUTH_DISABLED=1` in `.env`, run the gateway, and expose it:

```bash
# Start gateway
uv run python -m connector_app.server

# Start tunnel (--http-host-header is REQUIRED)
cloudflared tunnel --url http://127.0.0.1:8000 --http-host-header 127.0.0.1:8000 --no-autoupdate
```

The user pastes the `*.trycloudflare.com/mcp` URL into claude.ai → Settings → Connectors → Add custom connector.

## Session Contract (the front door)

The model **must** call `begin_session` first in any conversation. Enforced structurally:

```
begin_session()  →  session token + rules + persona + state
                        ↓
            domain_* / user_* tools require session token
                        ↓
                    [tool runs or refuses]
```

If `begin_session` errors → model says "session cannot continue". Never invents.

## Identity Architecture

```
OAuth token → auth.verified_claims() → sub (user id)
                     ↓
         begin_session reads sub from token
                     ↓
         session.new_session_token(sub) → signed HS256 token
                     ↓
         domain_* / user_* tools: session.require_session(token) → sub
```

**Never** read a user id from a tool argument. Only from the verified token's `sub`.

## Environment Variables (.env)

```
DATABASE_URL=postgresql://...                              # Neon connection string
RESOURCE_URL=http://localhost:8000                          # Your gateway's URL (the audience)
AUTH_ISSUER=http://localhost:9000                           # Authorization server URL
AUTH_JWKS_URL=http://localhost:9000/jwks.json              # JWKS endpoint
SESSION_SIGNING_SECRET=<random 64-char secret>             # python -c "import secrets; print(secrets.token_urlsafe(48))"
AUTH_DISABLED=0                                             # 1 = skip OAuth (Part 5 demo)
DEV_SUB=dev-user-001                                       # Fixed user when AUTH_DISABLED=1
```

## OAuth Details (get this right)

- This server is an **OAuth 2.1 resource server ONLY**. Do not implement an authorization server.
- Expose `/.well-known/oauth-protected-resource` (RFC 9728).
- `auth.py` checks all four: signature, `iss`, `aud` (RFC 8707), `exp`.
- Require **PKCE with S256** (mandatory in current MCP auth spec).
- Target the current MCP authorization spec revision (verify via Context7).

## Code Standards

- Python 3.14+ with modern typing: built-in generics, `X | None`, PEP 695 type aliases
- `uv` for environment and dependencies
- `uv add <package>` against current versions — never pin from memory
- Local dev port `8000`, binding `127.0.0.1:8000`

## Fail-Closed Enforcement (3 layers)

1. **Rule** (config_store.py): "If begin_session is unreachable or any tool errors, tell the reader the session cannot continue. Do not improvise."
2. **Reminder** (server.py): Appended to every tool return — "If a tool errors or the store is unreachable, tell the reader the session cannot continue — never invent their shelf or state."
3. **Code** (server.py): try/except around every DB call returns a hard error message before the model sees anything.

## Common Pitfalls

- **MCP namespaces**: Tool names allow only letters, digits, `_`, and `-`. Use underscore prefix (`domain_get_item`), never a dot.
- **`421` on tunnel**: Always pass `--http-host-header 127.0.0.1:8000` to cloudflared.
- **Windows psycopg**: Requires `WindowsSelectorEventLoopPolicy()`.
- **Pool timeout**: Set `timeout=5, reconnect_timeout=5` on `AsyncConnectionPool` for fail-fast DB errors.
- **`get_http_request()`**: `get_http_headers()` strips `authorization` — use `get_http_request().headers` instead.

## Self-Check (capstone rubric)

1. One gateway, three tool groups (`domain_*`, `user_*`, `config_*`)
2. Tools only (no MCP resources or prompts for app logic)
3. Two-table memory that persists across separate chats
4. Identity from `sub`, never from the model
5. PKCE S256 + audience-bound tokens
6. `begin_session` cooperative, called first, reinforced on every return
7. Working tools gated behind the session token
8. Fail-closed rule that refuses, not improvises

## Files That Ship Complete (DO NOT REGENERATE)

- `src/connector_app/auth.py` — OAuth token verification (the four checks)
- `src/connector_app/session.py` — HS256 session token mint/verify

Everything else (`server.py`, `db.py`, `config_store.py`) is built through the course.
