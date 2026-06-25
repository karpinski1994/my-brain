---
document-type: trd
status: draft
chapter: 0
created: 2026-06-24
---

# MyBrain — Technical Requirements Document

> **Second Brain — Gamified Productivity with Local LLM Orchestration**

---

## 1. System Architecture

### 1.1 High-Level Pattern

Two-service architecture with a clear separation of concerns:

```
┌──────────────────────┐     ┌──────────────────────┐
│   Next.js Frontend   │     │   FastAPI Backend     │
│   (Vercel Free)      │◀───▶│   (Railway Free)     │
│                      │     │                      │
│  - Dashboard UI      │     │  - WhatsApp Webhook  │
│  - Todo/Cal/Quest UI │     │  - LLM Orchestration │
│  - Stats View        │     │  - Todo CRUD API     │
│                      │     │  - Calorie API       │
└──────────────────────┘     │  - Gamification API  │
                             │  - Brain Q&A API     │
                             │  - LangChain RAG     │
                             │  - Pydantic AI       │
                             └──────────┬───────────┘
                                        │
                             ┌──────────▼───────────┐
                             │   PostgreSQL +        │
                             │   pgvector            │
                             │   (Neon Free)         │
                             └──────────────────────┘
                                        │
                             ┌──────────▼───────────┐
                             │   LLM Provider        │
                             │   (Gemini Free /      │
                             │    HF Inference /     │
                             │    Ollama)            │
                             └──────────────────────┘
```

### 1.2 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Pattern** | Two-service monolith (not microservices) | Single backend service is simpler for MVP; no need for service discovery or message queues |
| **Communication** | REST over HTTPS | Frontend calls backend API; WhatsApp webhook hits backend directly |
| **LLM layer** | LangChain + Pydantic AI | LangChain for chains/RAG/prompts; Pydantic AI for typed structured outputs |
| **Database** | PostgreSQL + pgvector | Best for LangChain RAG (vector embeddings), relational integrity, and future multi-user |

---

## 2. Technology Stack

### 2.1 Backend — FastAPI

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| **Framework** | FastAPI | ≥0.115 | Async-first, Pydantic-native, auto OpenAPI docs |
| **Runtime** | Python | ≥3.12 | Type hints, performance, ecosystem |
| **ORM** | SQLAlchemy 2.0 | ≥2.0 | Async support, well-tested, Pydantic integration |
| **Migrations** | Alembic | Latest | Industry standard for SQLAlchemy |
| **LLM Framework** | LangChain | ≥0.3 | Prompt management, chains, RAG pipeline |
| **Structured Output** | Pydantic AI | Latest | Typed LLM response parsing with Pydantic models |
| **HTTP Client** | httpx | Latest | Async HTTP for LLM API calls |
| **WhatsApp SDK** | custom (no SDK) | — | Simple webhook verification + REST client |
| **Validation** | Pydantic v2 | Latest | Native to FastAPI, also used by Pydantic AI |

### 2.2 Frontend — Next.js

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Next.js 14+ (App Router) | Vercel-native, React, SSR/SSG |
| **Language** | TypeScript strict | Type safety across frontend |
| **Styling** | Tailwind CSS | Utility-first, dark mode friendly |
| **State** | React hooks + SWR | Lightweight data fetching, stale-while-revalidate |
| **Charts** | Recharts | Simple React-native charting for calorie weekly view |

### 2.3 Database — PostgreSQL + pgvector

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Provider** | Neon (free tier) | Serverless PostgreSQL, 500MB, pgvector support, free |
| **Vector extension** | pgvector | Store and query embeddings for brain context RAG |
| **Driver** | asyncpg | Async PostgreSQL driver for FastAPI |

### 2.4 LLM Provider

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Primary** | Gemini API (free tier) | 60 requests/min free, 1.5 Flash model, good structured output |
| **Fallback** | Hugging Face Inference API | Free tier available, wider model selection |
| **Future** | Ollama (self-hosted) | When running locally, zero cost, full privacy |

---

## 3. Data Design & Schema

### 3.1 Entity Relationship

```
todos
  id              UUID (PK)
  title           TEXT NOT NULL
  description     TEXT
  priority        TEXT NOT NULL CHECK (IN 'low','medium','high')
  tags            JSONB
  status          TEXT NOT NULL DEFAULT 'pending'
  parent_id       UUID (FK → todos.id, nullable)
  xp_value        INTEGER NOT NULL
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  completed_at    TIMESTAMPTZ

calorie_logs
  id              UUID (PK)
  food_name       TEXT NOT NULL
  calories        INTEGER NOT NULL
  serving_size    TEXT
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()

user_stats
  id              INTEGER (PK, single row)
  total_xp        INTEGER NOT NULL DEFAULT 0
  current_streak  INTEGER NOT NULL DEFAULT 0
  longest_streak  INTEGER NOT NULL DEFAULT 0
  last_activity_date DATE
  daily_calorie_goal INTEGER NOT NULL DEFAULT 2000

xp_events
  id              UUID (PK)
  source          TEXT NOT NULL
  source_id       UUID
  xp_awarded      INTEGER NOT NULL
  multiplier      REAL NOT NULL DEFAULT 1.0
  xp_total_awarded INTEGER NOT NULL
  skill_tree      TEXT
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()

brain_documents
  id              UUID (PK)
  filename        TEXT NOT NULL
  content         TEXT NOT NULL
  embedding       VECTOR(768)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### 3.2 Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| todos | `(status, priority)` | Filter pending + sort by priority |
| todos | `(parent_id)` | Subtask lookups |
| calorie_logs | `(logged_at)` | Daily/weekly aggregation queries |
| xp_events | `(source, source_id)` | Event lookup |
| brain_documents | `(embedding)` | IVFFlat index for vector search |

---

## 4. API & Integration Specs

### 4.1 Frontend ↔ Backend API (REST)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/todos` | List todos (filterable by status, priority) |
| POST | `/api/todos` | Create todo |
| PUT | `/api/todos/{id}` | Update todo |
| DELETE | `/api/todos/{id}` | Delete todo |
| PATCH | `/api/todos/{id}/complete` | Mark complete + award XP |
| GET | `/api/calories` | List calorie logs (filterable by date range) |
| POST | `/api/calories` | Create calorie entry |
| DELETE | `/api/calories/{id}` | Delete entry |
| GET | `/api/calories/summary` | Daily total, goal, remaining |
| GET | `/api/calories/weekly` | Per-day totals for last 7 days |
| GET | `/api/stats` | XP total, streak, level |
| GET | `/api/quests` | Active quests with progress |
| GET | `/api/brain/ask?q={question}` | Brain Q&A |

All responses: JSON with `{ "data": ..., "error": ... }` envelope.

### 4.2 WhatsApp Webhook (External → Backend)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/whatsapp` | Webhook verification (hub.challenge) |
| POST | `/api/whatsapp` | Incoming message webhook |

Webhook payload parsed → intent classified via LLM → action executed → reply sent.

### 4.3 LLM Integration

```
Intent Classification:
  User message → LangChain prompt template → LLM → Pydantic AI parser
  → { intent: str, confidence: float, entities: dict }

Calorie Estimation:
  "200g chicken breast" → LangChain prompt → LLM → Pydantic AI parser
  → { food_name: str, calories: int, serving_size: str }

Brain Q&A:
  User question → embedding query (pgvector) → top-k chunks → LangChain QA chain → LLM → answer
```

---

## 5. Infrastructure & Deployment

### 5.1 Services

| Service | Platform | Tier | Details |
|---------|----------|------|---------|
| **Backend** | Railway | Free ($5 credit/mo) | Dockerized FastAPI, auto-deploy from GitHub |
| **Frontend** | Vercel | Hobby (free) | Next.js SPA, auto-deploy from GitHub |
| **Database** | Neon | Free (500MB) | PostgreSQL 16 + pgvector, auto-pause after inactivity |
| **LLM** | Gemini API | Free (60 req/min) | API key via environment variable |
| **WhatsApp** | WhatsApp Cloud API | Free | Meta developer account, phone number ID |

### 5.2 CI/CD

- GitHub monorepo with Turborepo
- Railway: auto-deploy `backend/` directory on push to main
- Vercel: auto-deploy `frontend/` directory on push to main
- Database migrations: Alembic auto-generated, run as release step on Railway

### 5.3 Environment Variables

```
# Backend
DATABASE_URL=postgresql+asyncpg://...
GEMINI_API_KEY=...
WHATSAPP_APP_SECRET=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
FRONTEND_URL=https://...
DAILY_CALORIE_GOAL=2000
LLM_PROVIDER=gemini

# Frontend
NEXT_PUBLIC_API_URL=https://backend.railway.app/api
```

---

## 6. Security Architecture

| Layer | Measure |
|-------|---------|
| **WhatsApp webhook** | `X-Hub-Signature` verification against app secret |
| **Frontend→Backend** | Simple token auth (static API key in header) or no auth behind Vercel if same deployment |
| **LLM API keys** | Environment variables only, never in code or logs |
| **Database** | Neon SSL-enforced connections, connection string with password |
| **CORS** | Backend CORS restricted to frontend domain |
| **Rate limiting** | Not required for single-user MVP |

---

## 7. Performance & Scalability

| Aspect | Strategy |
|--------|----------|
| **LLM latency** | LLM calls are async; WhatsApp response sent after LLM reply. Target <5s total |
| **Database** | pgvector IVFFlat index for sub-100ms vector search |
| **Frontend** | Static export or ISR on Vercel, SWR caching for API calls |
| **Cold starts** | Railway free tier may have cold start delay (5-15s). Acceptable for MVP |
| **Scaling** | Horizontally irrelevant for single-user; PostgreSQL handles 1 concurrent user easily |

---

## 8. Error Handling & Logging

| Aspect | Strategy |
|--------|----------|
| **Logging** | Python `structlog` for structured JSON logs |
| **Error responses** | All API errors return `{ "error": { "code": str, "message": str } }` |
| **LLM failures** | Caught at LangChain/Pydantic AI layer → user gets descriptive fallback |
| **Database errors** | SQLAlchemy session rollback on exception, logged, user informed |
| **Monitoring** | None for MVP (single-user). Railway dashboard for basic health checks |
| **WhatsApp retries** | WhatsApp retries webhook if no 200 within 5s; handler must respond fast |

---

**Next Step:** HLD — High-Level Design (Macro Architecture & Module Decomposition)

*Draft for approval.*
