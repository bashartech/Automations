---
name: enterprise-ai-chatbot
description: Build a production-ready Enterprise AI Chatbot using FastAPI, OpenAI Agents SDK with Groq, Next.js 16, Shadcn UI, and Neon PostgreSQL. Covers Clean Architecture, Google SSO, allowlist auth, streaming chat, AI agent with product tools, and full-stack integration.
---

# Enterprise AI Chatbot

Build a full-stack AI chatbot where employees authenticate via Google Workspace SSO and chat with an AI assistant that answers questions about products stored in PostgreSQL. Uses OpenAI Agents SDK with Groq (OpenAI-compatible API) and follows Clean Architecture with clear separation of API, services, repositories, models, and AI layers.

## Architecture

```
frontend/          # Next.js 16 + TypeScript + TailwindCSS v4 + Shadcn UI (base-nova)
backend/           # FastAPI + Python 3.12+ 
  ├── config/      # Settings (pydantic-settings), Logging (structlog)
  ├── database/    # SQLAlchemy async engine, session factory, seed data
  ├── models/      # ORM models (User, AllowedUser, Product, ProductDetail, Conversation, Message)
  ├── repositories/# Data access layer (UserRepo, ProductRepo, ConversationRepo, AllowedUserRepo)
  ├── services/    # Business logic (ChatService)
  ├── api/         # FastAPI routers (chat, conversations, products)
  ├── auth/        # JWT auth, Google OAuth, session management, FastAPI dependencies
  ├── ai/          # ModelProvider abstraction, Groq client, Agent, Tools
  └── alembic/     # Database migrations
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | FastAPI |
| AI SDK | OpenAI Agents SDK (`openai-agents>=0.0.7`) |
| LLM Provider | Groq (OpenAI-compatible API) |
| Database | Neon PostgreSQL (async via asyncpg) |
| ORM | SQLAlchemy 2.0 (async) |
| Migrations | Alembic |
| Auth | Google OAuth 2.0 + JWT (python-jose) + allowlist |
| Frontend | Next.js 16, TypeScript, TailwindCSS v4 |
| UI Library | Shadcn UI (base-nova style, @base-ui/react primitives) |
| Streaming | Server-Sent Events (SSE) |

## Phased Implementation Plan

### Phase 1a: Backend Scaffold
- Create `backend/pyproject.toml` with dependencies: `fastapi`, `uvicorn`, `sqlalchemy[asyncio]`, `asyncpg`, `alembic`, `pydantic`, `pydantic-settings`, `httpx`, `python-jose[cryptography]`, `google-auth`, `openai`, `openai-agents`, `structlog`, `python-multipart`
- Create `backend/.env` with all secrets (never commit)
- Create `backend/main.py` with FastAPI app, CORS middleware, health endpoint

### Phase 1b: Configuration & Logging
- `config/settings.py`: `pydantic-settings` `Settings` class reading `.env`, properties for `cors_origins` (list), `async_database_url` (auto-replaces `postgresql://` → `postgresql+asyncpg://`)
- `config/logging.py`: structlog JSON logging with `setup_logging()` + `logger` singleton

### Phase 1c: Frontend Scaffold
- `npx create-next-app@latest frontend --typescript --tailwind --eslint`
- `npx shadcn@latest init` with base-nova style
- Add core Shadcn components: button, input, card, avatar, dropdown-menu, scroll-area, separator, sheet
- Install deps: `@base-ui/react`, `class-variance-authority`, `lucide-react`, `clsx`, `tailwind-merge`, `react-markdown`, `remark-gfm`, `@tailwindcss/typography`
- Create `src/lib/utils.ts` with `cn()` function using `clsx` + `tailwind-merge`

### Phase 1d: Verify Build
- Backend: `uvicorn main:app` starts without errors
- Frontend: `npm run build` compiles without errors

### Phase 2: Database Layer

**Models** (`models/`):
```python
# models/user.py
class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    picture: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_login: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

Tables: `users`, `allowed_users`, `products`, `product_details` (one-to-one with products), `conversations`, `messages`

**Repositories** (`repositories/`): Each takes `AsyncSession` in constructor.
- `UserRepository`: `get_by_email`, `get_by_id`, `create`, `update_last_login`, `upsert`
- `AllowedUserRepository`: `is_allowed(email) -> bool`
- `ProductRepository`: `list_all(skip, limit)`, `get_by_id`, `get_by_name` (ilike), `search(query, limit)` (searches name/desc/category/manufacturer)
- `ConversationRepository`: `list_by_user`, `get_by_id`, `create`, `rename`, `delete`, `get_messages(conversation_id, skip, limit)`, `add_message`

**Database engine** (`database/engine.py`):
- Create `create_async_engine` with pool_size=5, max_overflow=10
- Create `async_session_factory = async_sessionmaker(engine, expire_on_commit=False)`
- Async generator `get_session()` yielding session, closing in `finally`

**Migrations**: `alembic init` with async config in `env.py`, single initial migration creating all 6 tables.

**Seed** (`database/seed.py`): 10 demo allowed users + 15 realistic products with details.

### Phase 3: Email Allowlist Auth

**Schema** (`auth/schemas.py`):
```python
class LoginRequest(BaseModel):
    email: str
class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
class UserResponse(BaseModel):
    id: UUID; email: str; name: str; picture: str | None; created_at: datetime; last_login: datetime
```

**JWT Service** (`auth/service.py`):
- `create_access_token(user_id: UUID) -> str`: JWT with `sub=user_id`, `exp`, `iat`, signed with `settings.session_secret_key` (HS256)
- `verify_access_token(token: str) -> UUID`: decode JWT, raise `AuthError` on failure
- `AuthService.login(email)`: check allowlist (`AllowedUserRepository.is_allowed`), upsert user in `users` table via `UserRepository.upsert`, commit, return token + user dict

**Dependencies** (`auth/dependencies.py`):
- `get_current_user`: FastAPI `Depends`, extracts Bearer token, verifies JWT, loads user from DB, returns user dict

**Routes** (`auth/router.py`):
- `POST /auth/login`: email-based login for allowlist mode
- `GET /auth/me`: returns current user
- `POST /auth/logout`: clears session

### Phase 4: Google SSO

**Google OAuth** (`auth/google.py`):
- `build_google_auth_url(redirect_uri)`: constructs Google OAuth URL with scopes `openid email profile`
- `exchange_code_for_token(code, redirect_uri)`: POST to `https://oauth2.googleapis.com/token` with auth code
- `verify_google_id_token(id_token_str)`: verify using `google.oauth2.id_token.verify_oauth2_token`, check issuer, email_verified
- `google_login(code, redirect_uri, session)`: exchange code, verify token, check allowlist/domain authority, upsert user, return JWT

**Routes added**:
- `GET /auth/login`: redirects to Google consent screen using `settings.auth_redirect_uri`
- `GET /auth/callback`: handles Google redirect, exchanges code, redirects to frontend with `?token=JWT`

### Phase 5: AI Layer

**ModelProvider** (`ai/provider.py`):
```python
from agents.models.interface import Model, ModelProvider
from agents.models.openai_provider import OpenAIProvider

class GroqModelProvider(ModelProvider):
    def __init__(self):
        self._provider = OpenAIProvider(
            base_url="https://api.groq.com/openai/v1",
            api_key=settings.groq_api_key,
        )
    def get_model(self, model_name: str | None) -> Model:
        return self._provider.get_model(model_name or settings.groq_model)
```

**Tools** (`ai/tools.py`): All use `@function_tool` with `context: RunContextWrapper` as first param. Access DB via `context.context.session`. Tools:
- `get_product_by_name(name)`: returns formatted product info
- `get_product_price(name)`: returns price string
- `get_product_details(name)`: returns full spec sheet
- `list_products(category=None)`: lists all products, optional category filter
- `search_products(query)`: search across name/desc/category/manufacturer

**Agent** (`ai/agent.py`):
- `create_agent()`: `Agent(name="ProductAssistant", instructions=..., model=settings.groq_model, tools=[...])`
- `run_agent_streamed(input, context)`: `Runner.run_streamed(starting_agent=agent, input=input, context=context, run_config=RunConfig(model_provider=GroqModelProvider(), tracing_disabled=True))`

### Phase 6: Chat API & Service

**Chat Service** (`services/chat_service.py`):
- `get_or_create_conversation(user_id, conversation_id)`: create new or validate existing
- `stream_chat(conversation_id, user_message, user_id, is_new)`: auto-title new conversations from first message (truncate to ~60 chars), save user message, build history (last 50 messages), run agent streamed, yield SSE events (`{"type":"token","content":"..."}`, `{"type":"done","conversation_id":"..."}`, `{"type":"error","content":"..."}`), save assistant message on completion

**Routes**:
- `POST /chat`: accepts `{ message, conversation_id? }`, returns `StreamingResponse` with SSE
- `GET /conversations`: list user's conversations (ordered by created_at desc)
- `POST /conversations`: create new conversation
- `GET /conversations/{id}`: get conversation (ownership check)
- `PATCH /conversations/{id}`: rename conversation
- `DELETE /conversations/{id}`: delete conversation (cascade deletes messages)
- `GET /conversations/{id}/messages`: get messages for conversation

### Phase 7: Product API

- `GET /products?skip=0&limit=20`: list products with pagination
- `GET /products/search?q=...&limit=10`: search products
- `GET /products/{id}`: get product with details

### Phase 8: Frontend Auth UI

**Auth Context** (`src/lib/auth-context.tsx`):
- `AuthProvider` with `user`, `loading`, `login(email)`, `loginWithGoogle()`, `logout()`, `setToken(token)` 
- On mount: checks `localStorage` for token, calls `GET /auth/me` to validate
- `setToken`: stores token in localStorage, fetches user profile

**API Client** (`src/lib/api.ts`):
- `api.auth.login`, `api.auth.me`, `api.auth.logout`, `api.auth.googleLogin()` (redirects to backend)
- `api.conversations.list`, `.create`, `.get`, `.rename`, `.delete`, `.messages`
- `api.chat.send(message, conversationId?)`: returns raw `Response` for streaming
- `api.products.list`, `.search`, `.get`
- All requests include `Authorization: Bearer <token>` header

**Components**:
- `LoginScreen`: "Enterprise AI Chatbot" title + "Login with Google" button (Google SVG icon)
- `AuthCallbackPage` at `/auth/callback`: reads `?token=` from URL, calls `setToken`, redirects to `/`
- `ThemeProvider`: dark/light/system theme with `class`-based toggling, persists to localStorage

**User Menu**: Avatar dropdown (initials from name, profile image from Google) with logout option. Dark/light toggle button.

### Phase 9: Frontend Chat Interface

**Layout**: Full-height flex layout with sidebar (desktop: always visible, mobile: Sheet slide-out) + main chat area.

**Sidebar**: 
- "New Chat" button
- Conversation list with active state highlighting, truncation, delete button (appears on hover)
- Empty state: "No conversations yet"

**Chat Area**:
- **Empty state**: centered icon + "Ask about products" heading
- **Message bubbles**: user messages right-aligned (primary bg), AI responses left-aligned (muted bg) with react-markdown rendering (`ReactMarkdown` + `remarkGfm` + `prose` classes from `@tailwindcss/typography`)
- **Typing indicator**: 3 bouncing dots animation while waiting for first token
- **Auto-scroll**: `useRef` + `scrollIntoView` on messages change

**Streaming**: 
- `POST /chat` → read response body via `ReadableStream` → parse SSE `data: ` lines → update last message progressively
- On error: show error message bubble
- On done: update `conversation_id`, refresh sidebar list

**Input**: Text input with Enter to send (disabled while streaming), send button.

### Phase 10: Polish & Security

**Middleware** (`backend/middleware.py`):
- `RequestIDMiddleware`: generates X-Request-ID, adds to response
- `SecurityHeadersMiddleware`: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, Referrer-Policy
- `add_error_handlers`: global exception handler logging with request_id

## Key Patterns

### Repository Pattern
```python
class UserRepository:
    def __init__(self, session: AsyncSession): ...
    async def upsert(self, email: str, name: str, picture: str | None = None) -> User: ...
```
All DB access goes through repositories, never raw SQL. The LLM agent calls tools → tools use repositories → repositories use SQLAlchemy.

### Dependency Injection
```python
async def get_session():
    async with async_session_factory() as session:
        yield session

@router.get("/me")
async def me(current_user: dict = Depends(get_current_user),
             session: AsyncSession = Depends(get_session)):
    ...
```

### ModelProvider Abstraction
Switch LLM providers by creating a new provider class:
```python
class GroqModelProvider(ModelProvider):
    def __init__(self):
        self._provider = OpenAIProvider(base_url="https://api.groq.com/openai/v1", api_key=...)

class OtherModelProvider(ModelProvider):
    def __init__(self):
        self._provider = OpenAIProvider(base_url="https://api.other.com/v1", api_key=...)
```
Agent code never changes — only the provider class and `.env` config.

### Auth Flow
```
[Login with Google] → GET /auth/login → Google consent → /auth/callback?code=...
  → exchange code → verify ID token → check allowlist/domain → upsert user
  → generate JWT → redirect to frontend?token=JWT
  → frontend stores in localStorage → Authorization: Bearer <token> on all requests
```

### Streaming Chat Flow
```
POST /chat { message, conversation_id? }
  → create/validate conversation
  → auto-title if new (first ~60 chars of message)
  → save user message to DB
  → load last 50 messages as agent history
  → Runner.run_streamed(agent, history, context)
  → stream SSE events: {"type":"token","content":"..."}
  → on complete: save assistant message, yield {"type":"done","conversation_id":"..."}
```

## Critical Rules

1. **Never expose raw SQL to the LLM** — all queries go through typed tool functions → repositories
2. **Never store secrets in source code** — all secrets in `.env`, loaded via `pydantic-settings`
3. **Every request must verify auth** — use `get_current_user` dependency on all protected routes
4. **User isolation** — conversations/products are always scoped to `current_user["id"]`
5. **No placeholder code** — every phase produces working, production-quality code
6. **No mock APIs** — always integrate with real services
7. **Clean Architecture** — API <> Service <> Repository <> Model, never skip layers
8. **Streaming first** — chat responses must stream via SSE, never wait for full response
9. **Redirect URI must match Google Cloud Console** — configure `AUTH_REDIRECT_URI` in `.env` and register the exact same URL in Google Cloud Console → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs
10. **Frontend builds before backend changes** — verify `npm run build` before modifying backend

## Project Structure (Complete)

```
.env                          # Shared env vars (backend reads parent .env too)
details.md                    # Full spec
backend/
├── .env                      # Backend env vars
├── main.py                   # FastAPI app entry point
├── pyproject.toml            # Python deps
├── alembic.ini               # Alembic config
├── middleware.py              # Request ID, security headers, global error handler
├── config/
│   ├── __init__.py
│   ├── settings.py           # pydantic-settings Settings class
│   └── logging.py            # structlog setup
├── database/
│   ├── __init__.py
│   ├── base.py               # DeclarativeBase
│   ├── engine.py             # async engine + get_session
│   ├── seed.py               # seed data
│   └── seed_runner.py        # standalone seed script
├── models/
│   ├── __init__.py
│   ├── user.py
│   ├── allowed_user.py
│   ├── product.py
│   ├── product_detail.py
│   └── conversation.py       # Conversation + Message
├── repositories/
│   ├── __init__.py
│   ├── user_repo.py
│   ├── allowed_user_repo.py
│   ├── product_repo.py
│   └── conversation_repo.py
├── services/
│   ├── __init__.py
│   └── chat_service.py
├── api/
│   ├── __init__.py
│   ├── chat.py               # POST /chat (SSE streaming)
│   ├── conversations.py      # Conversations CRUD
│   └── products.py           # Product listing/search
├── auth/
│   ├── __init__.py
│   ├── schemas.py            # Pydantic request/response models
│   ├── service.py            # JWT + AuthService
│   ├── dependencies.py       # get_current_user
│   ├── router.py             # Auth endpoints
│   └── google.py             # Google OAuth flow
├── ai/
│   ├── __init__.py
│   ├── provider.py           # GroqModelProvider
│   ├── tools.py              # 5 product tools
│   └── agent.py              # Agent setup + runner
└── alembic/
    ├── env.py
    ├── script.py.mako
    └── versions/
        └── 6d4bf3db8535_initial.py

frontend/
├── package.json
├── components.json           # Shadcn config
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
└── src/
    ├── lib/
    │   ├── utils.ts          # cn() helper
    │   ├── api.ts            # API client
    │   └── auth-context.tsx  # Auth context/provider
    ├── components/
    │   ├── ui/               # Shadcn components
    │   │   ├── avatar.tsx
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── input.tsx
    │   │   ├── scroll-area.tsx
    │   │   ├── separator.tsx
    │   │   └── sheet.tsx
    │   └── theme-provider.tsx
    └── app/
        ├── globals.css        # Tailwind + CSS vars + @plugin typography
        ├── layout.tsx         # Root layout with fonts + AuthProvider + ThemeProvider
        ├── page.tsx           # Login screen ↔ ChatApp (conditionally rendered)
        └── auth/
            └── callback/
                └── page.tsx   # OAuth callback handler

## API Endpoints Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/login | No | Email allowlist login |
| GET | /auth/login | No | Google SSO redirect |
| GET | /auth/callback | No | Google OAuth callback |
| GET | /auth/me | Yes | Current user profile |
| POST | /auth/logout | Yes | Logout |
| POST | /chat | Yes | Streaming chat |
| GET | /conversations | Yes | List conversations |
| POST | /conversations | Yes | Create conversation |
| GET | /conversations/{id} | Yes | Get conversation |
| PATCH | /conversations/{id} | Yes | Rename conversation |
| DELETE | /conversations/{id} | Yes | Delete conversation |
| GET | /conversations/{id}/messages | Yes | Get messages |
| GET | /products | Yes | List products |
| GET | /products/search | Yes | Search products |
| GET | /products/{id} | Yes | Get product |
| GET | /health | No | Health check |

## Environment Variables (.env)

```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
GROQ_TEMPERATURE=0.7
GROQ_MAX_TOKENS=2048
NEON_DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
AUTH_MODE=allowlist|workspace
ALLOWED_DOMAIN=yourcompany.com
AUTH_REDIRECT_URI=http://localhost:8000/auth/callback
SESSION_SECRET_KEY=change-me-in-production
SESSION_EXPIRY_MINUTES=60
CORS_ORIGIN_STRING=http://localhost:3001
```

## Usage

Run this skill when building a new enterprise chatbot or adding AI chat features to an existing FastAPI/Next.js app:

```
/enterprise-ai-chatbot
```

Or with a specific phase:
```
/enterprise-ai-chatbot --phase 3
```
