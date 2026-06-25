---
document-type: trd
status: draft
chapter: 0
created: 2026-06-24
---

# MyBrain — Technical Requirements Document

> **Second Brain — Gamified Productivity with Local LLM Orchestration**

> **ℹ️ MVP Implementation Note:** The current MVP is implemented as an opencode skill with file-based markdown storage (see `.opencode/skills/mybrain/`). This document describes the target architecture for the full production deployment.

---

## 1. System Architecture

### 1.1 High-Level Pattern

Two-service architecture with a clear separation of concerns:

```
┌──────────────────┐     ┌───────────────────────────┐
│  Next.js         │     │  FastAPI (Railway Free)    │
│  Frontend        │     │                            │
│  (Vercel Free)   │◀───▶│  ┌─────────────────────┐  │
│                  │     │  │ Orchestrator Agent   │──│──▶ LLM
│  - Dashboard UI  │     │  │ (plans, tools,      │  │    (Gemini/HF)
│  - Todo/Cal UI   │     │  │  delegates)          │  │
│  - Quests UI     │     │  └───────┬─────────────┘  │
│  - Stats View    │     │          │                 │
└──────────────────┘     │  ┌───────▼─────────────┐  │
                         │  │ Tools:              │  │
                         │  │  • Todo CRUD        │──│──▶ PostgreSQL
                         │  │  • Calorie Log      │  │    + pgvector
                         │  │  • RAG Search       │  │    (Neon Free)
                         │  │  • Stats/Quests     │  │
                         │  └───────┬─────────────┘  │
                         │          │                 │
                         │  ┌───────▼─────────────┐  │
                         │  │ Sub-Agents:         │  │
                         │  │  • Calorie Agent    │  │
                         │  │  • Brain Agent      │  │
                         │  │  • Gamification     │  │
                         │  │    Agent            │  │
                         │  └─────────────────────┘  │
                         └───────────────────────────┘
```

### 1.2 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Pattern** | Two-service monolith + agentic orchestration | Single backend service with an orchestrator agent that plans and executes via tools |
| **Communication** | REST over HTTPS | Frontend calls backend API; WhatsApp webhook hits backend directly |
| **LLM layer** | LangChain + Pydantic AI with agent pattern | LangChain for agent/tool framework and RAG; Pydantic AI for typed structured outputs |
| **Agent framework** | LangChain AgentExecutor or LangGraph | Orchestrator agent decides tool calls, delegates to sub-agents |
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
| **LLM Framework** | LangChain | ≥0.3 | Agent/tool framework, RAG pipeline, prompt management |
| **Structured Output** | Pydantic AI | Latest | Agent/tool result parsing, typed LLM responses |
| **Agent Orchestration** | LangChain AgentExecutor / LangGraph | Latest | Orchestrator agent with tool-use and sub-agent delegation |
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

conversation_logs
  id              UUID (PK)
  role            TEXT NOT NULL CHECK (IN 'user','assistant','tool_call','tool_result')
  content         TEXT NOT NULL
  tool_name       TEXT
  tool_input      JSONB
  tool_output     JSONB
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
| conversation_logs | `(created_at)` | Conversation history queries |

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

Webhook payload parsed → message + context sent to orchestrator agent → agent plans tools/sub-agents → action executed → reply sent.

```
POST /api/whatsapp → webhook.py (verify + parse)
  → agent/context.py (build system prompt + history + RAG)
  → agent/orchestrator.py (LLM agent loop: plan → tool call → evaluate → repeat/done)
  → whatsapp/client.py (send reply)
```

### 4.3 Agent Integration

```
Orchestrator Agent Loop (LangChain AgentExecutor / LangGraph):
  Input: { message: str, context: AgentContext }

  1. Agent receives message + system prompt + context
  2. LLM decides: what tool(s) to call?
  3. Tool registry executes:

     todo_tools.create_todo(title, desc?, priority?, tags?)
       → returns { id, title, status, xp_value }

     todo_tools.complete_todo(query)
       → fuzzy-matches, completes, awards XP → { title, xp_earned, streak }

     todo_tools.delete_todo(query)
       → fuzzy-matches, deletes → { title }

     calorie_tools.log(food_name, serving_size?)
       → LLM estimates calories → { food_name, calories, daily_total, goal_pct }

     calorie_tools.daily_summary()
       → { total, goal, remaining, entries[] }

     calorie_tools.weekly_summary()
       → { daily_totals[], average, trend }

     stats_tools.get_stats()
       → { total_xp, streak, level }

     rag_tool.search(query)
       → embeds query → pgvector search → { chunks[] }

  4. Agent evaluates tool result: done? need more tools? delegate?
  5. Delegate to sub-agent for complex tasks:

     CalorieSubAgent:
       handles "analyze my weekly calories and suggest improvements"
       → calls multiple calorie tools, synthesizes advice

     BrainSubAgent:
       handles multi-turn Q&A with follow-up questions
       → calls rag_tool repeatedly, maintains conversation state

     GamificationSubAgent:
       handles "what should I focus on for leveling up?"
       → calls stats_tools, analyzes XP gaps, suggests quests

  6. Agent formats final reply → sent to WhatsApp

Sub-agents are LangChain agents with their own system prompts
and restricted tool sets, invoked by the orchestrator.
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

### 5.3 Monorepo Structure

```
my-brain/
├── backend/              # FastAPI app (Railway)
│   ├── app/
│   ├── tests/
│   ├── alembic.ini
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/             # Next.js app (Vercel)
│   ├── app/
│   ├── lib/
│   ├── components/
│   ├── package.json
│   └── next.config.js
├── prompts/              # Shared system prompts
│   ├── system.md         # Main orchestrator system prompt
│   ├── calorie-agent.md  # Calorie sub-agent persona
│   ├── brain-agent.md    # Brain Q&A sub-agent persona
│   └── gamification.md   # Gamification sub-agent persona
├── brain-docs/           # Source markdown files (brain context)
│   ├── goals/
│   ├── campaigns/
│   ├── psychology/
│   └── ...
├── turbo.json
└── package.json
```

### 5.4 Environment Variables

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
AGENT_SYSTEM_PROMPT_FILE=prompts/system.md
BRAIN_DOCS_DIR=./brain-docs
MAX_CONVERSATION_HISTORY=20

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

**Next Step:** LLD — Low-Level Design (Class Design, DB Schema, Pseudocode)

*Draft for approval.*
