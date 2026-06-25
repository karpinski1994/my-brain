---
document-type: hld
status: draft
chapter: 0
created: 2026-06-24
---

# MyBrain — High-Level Design

> **Second Brain — Gamified Productivity with Local LLM Orchestration**

---

## 1. Conceptual Architecture

### 1.1 Pattern: Two-Service + Agentic LLM Orchestration

MyBrain follows a **frontend/backend split** with an **agentic LLM core** — the backend is not a traditional CRUD service but an agent orchestrator:

```
┌──────────────┐    REST/JSON     ┌──────────────────┐
│  Next.js     │◀───────────────▶│  FastAPI           │
│  (Vercel)    │                  │  (Railway)         │
│              │                  │                    │
│  Presentation│                  │  ┌──────────────┐  │
│  Layer       │                  │  │  Orchestrator │  │
└──────────────┘                  │  │  Agent        │──│───▶ LLM (Gemini/HF)
                                  │  └───────┬───────┘  │
                                  │          │          │
                                  │  ┌───────▼───────┐  │
                                  │  │ Tools:        │  │
                                  │  │  • DB CRUD    │──│───▶ PostgreSQL + pgvector
                                  │  │  • RAG Search │  │
                                  │  │  • Stats Calc │  │
                                  │  └───────┬───────┘  │
                                  │          │          │
                                  │  ┌───────▼───────┐  │
                                  │  │ Sub-Agents:   │  │
                                  │  │  • Todo Agent │  │
                                  │  │  • Calorie    │  │
                                  │  │    Agent      │  │
                                  │  │  • Brain      │  │
                                  │  │    Agent      │  │
                                  │  │  • Gamific.   │  │
                                  │  │    Agent      │  │
                                  │  └──────────────┘  │
                                  └──────────────────┘
```

**Core concept — Agentic Loop:**
```
WhatsApp message → Orchestrator Agent
  → decides which tool(s) to use
  → calls tools (DB query, RAG, stats)
  → tool results fed back to orchestrator
  → optionally delegates to specialized sub-agent
  → sub-agent returns result
  → orchestrator formats final reply
  → WhatsApp response
```

**Rationale for agentic architecture:**
- **Flexibility**: LLM decides the flow, not hardcoded if/else chains
- **Composability**: Sub-agents can be mixed (e.g., "log calories and complete the associated todo")
- **Context-aware**: Orchestrator maintains full conversation context across tool calls
- **Evolution**: New tools/sub-agents added without changing the routing logic

**Rationale for two-service split:**
- Frontend and backend have different lifecycles (Next.js updates / Python package changes)
- Backend Python ecosystem (LangChain, Pydantic AI, FastAPI) is best-in-class for LLM agent work
- Frontend serving static/assets on Vercel edge is cheaper than serving from a VPS
- Clear API contract between services enables independent development

**Rationale for NOT going full microservices:**
- Single user MVP — no need for separate auth, queue, or notification services
- Monolith within the backend keeps deployment simple (one Docker image, one Railway service)
- Can extract modules later when needed (e.g., separate LLM worker)

### 1.2 Architecture Characteristics

| Characteristic | Approach |
|----------------|----------|
| **Deployability** | Two deploys (Vercel + Railway), auto-deploy from GitHub |
| **Testability** | FastAPI auto docs + pytest for backend; Vitest for frontend |
| **Simplicity** | Single backend process, no message broker, no cache layer for MVP |
| **Cost** | $0 — all free tiers |

---

## 2. System Decomposition

### 2.1 Backend Modules (FastAPI)

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, middleware, lifespan
│   ├── config.py                # Pydantic Settings (env vars)
│   ├── database/
│   │   ├── engine.py            # SQLAlchemy async engine + session
│   │   ├── models.py            # ORM models (todos, calorie_logs, etc.)
│   │   ├── migrations/          # Alembic migration files
│   │   └── seed.py              # Initial seed data
│   ├── api/
│   │   ├── router.py            # Main API router (proxies to agent for WhatsApp)
│   │   ├── todos.py             # Todo CRUD endpoints (direct, via web UI)
│   │   ├── calories.py          # Calorie log endpoints (direct, via web UI)
│   │   ├── stats.py             # XP/stats endpoints
│   │   ├── quests.py            # Quest endpoints
│   │   └── brain.py             # Brain Q&A endpoints
│   ├── whatsapp/
│   │   ├── webhook.py           # Webhook verify + receive
│   │   └── client.py            # WhatsApp API outgoing client
│   ├── agent/
│   │   ├── orchestrator.py      # Main orchestrator agent (receives message, plans, executes)
│   │   ├── context.py           # Full context builder (system prompt + RAG + history)
│   │   ├── tools/
│   │   │   ├── __init__.py      # Tool registry
│   │   │   ├── todo_tools.py    # Create/complete/delete/query todos
│   │   │   ├── calorie_tools.py # Log/query/summarize calories
│   │   │   ├── stats_tools.py   # Get XP, streak, level
│   │   │   ├── quest_tools.py   # Query quest progress
│   │   │   └── rag_tool.py      # Brain context search tool
│   │   └── sub_agents/
│   │       ├── todo_agent.py    # Specialized agent for todo operations
│   │       ├── calorie_agent.py # Specialized agent for calorie tracking
│   │       ├── brain_agent.py   # Specialized agent for deep brain Q&A
│   │       └── gamification_agent.py # XP/streak/quest expert
│   ├── llm/
│   │   ├── provider.py          # LLM provider abstraction (Gemini/HF/Ollama)
│   │   └── models.py            # Pydantic AI models for structured output
│   ├── rag/
│   │   ├── embedder.py          # Document chunking + embedding
│   │   ├── retriever.py         # pgvector search
│   │   └── ingester.py          # Markdown ingestion pipeline
│   ├── schemas/
│   │   ├── todo.py              # Pydantic request/response schemas
│   │   ├── calorie.py
│   │   ├── stats.py
│   │   └── whatsapp.py
│   └── services/
│       ├── todo_service.py       # Business logic for todos
│       ├── calorie_service.py    # Business logic for calories
│       └── stats_service.py      # XP/streak business logic
├── tests/
├── alembic.ini
├── Dockerfile
└── pyproject.toml
```

### 2.2 Frontend Modules (Next.js)

```
frontend/
├── app/
│   ├── layout.tsx               # Root layout + navigation
│   ├── page.tsx                 # Dashboard (XP, streak, recent activity)
│   ├── todos/
│   │   ├── page.tsx             # Todo list with CRUD
│   │   └── components/          # Todo item, form, filters
│   ├── calories/
│   │   ├── page.tsx             # Calorie log + daily total + weekly chart
│   │   └── components/          # Entry list, daily summary, weekly chart
│   └── quests/
│       ├── page.tsx             # Quest list with progress
│       └── components/          # Quest card, progress bar
├── lib/
│   ├── api.ts                   # API client (fetch wrapper)
│   └── types.ts                 # Shared TypeScript types
├── components/
│   └── ui/                      # Reusable UI components (button, card, etc.)
├── package.json
└── next.config.js
```

### 2.3 Module Responsibility Map

| Module | Responsibility | Data Source |
|--------|---------------|-------------|
| **WhatsApp Webhook** | Receive messages, verify signature, pass to orchestrator agent | WhatsApp Cloud API |
| **Orchestrator Agent** | Receive message + full context → plan tool calls → delegate to sub-agents or call tools directly → format reply | LLM + all tools |
| **Context Builder** | Assemble system prompt (goals, campaign, rules), recent history, RAG results → feed to orchestrator | PostgreSQL + pgvector |
| **Todo Tools** | Create, complete, delete, query, fuzzy-match todos in DB | PostgreSQL `todos` |
| **Calorie Tools** | Log, query daily/weekly, calculate goal progress | PostgreSQL `calorie_logs` |
| **RAG Tool** | Embed query → pgvector search → return top chunks from brain docs | PostgreSQL `brain_documents` |
| **Stats Tools** | Query XP total, streak, level | PostgreSQL `xp_events`, `user_stats` |
| **Quest Tools** | Parse campaign markdown, query progress | File system + PostgreSQL |
| **Todo Sub-Agent** | Specialized agent for complex todo operations (multi-step, bulk) | LLM + Todo Tools |
| **Calorie Sub-Agent** | Specialized agent for detailed calorie analysis (trends, weekly summaries) | LLM + Calorie Tools |
| **Brain Sub-Agent** | Specialized agent for deep brain Q&A with multi-turn RAG | LLM + RAG Tool |
| **Gamification Sub-Agent** | Specialized agent for XP breakdown, streak advice, level-up planning | LLM + Stats Tools |
| **Frontend UI** | Display data, forms, charts, navigation | FastAPI REST API |

---

## 3. Data Flow & Communication

### 3.1 WhatsApp Message Lifecycle (Agentic Loop)

```
Step 1: RECEIVE
  WhatsApp Cloud API → POST /api/whatsapp (FastAPI)
  → webhook.py verifies X-Hub-Signature
  → Extracts: { from: number, text: body, timestamp }
  → Returns HTTP 200 immediately to prevent retry

Step 2: BUILD CONTEXT
  → agent/context.py assembles the full context:
    a) System prompt: user goals, campaign phase, gamification rules, personality
    b) Recent history: last N todos, current streak, last 5 messages
    c) Optional RAG: if message looks like a question, query brain docs
  → Returns: AgentContext { system_prompt, history, rag_chunks }

Step 3: ORCHESTRATOR AGENT LOOP
  → agent/orchestrator.py (LangChain AgentExecutor / Pydantic AI Agent):
    a) Receives message + AgentContext
    b) LLM decides: which tool to call? or delegate to sub-agent?
    c) Calls tool(s) → gets structured result
    d) Evaluates result: need another tool? done?
    e) If complex domain → delegates to sub-agent:
       - calorie trend analysis → Calorie Sub-Agent
       - multi-turn brain Q&A → Brain Sub-Agent
       - gamification advice → Gamification Sub-Agent
    f) Sub-agent returns result to orchestrator
    g) Loop until orchestrator decides task is complete

Step 4: FORMAT & REPLY
  → Orchestrator formats final response text
  → whatsapp/client.py POSTs to WhatsApp Cloud API
  → User receives message in WhatsApp

Example:
  User: "add task edit video and 200g chicken breast for lunch"
  → Orchestrator:
    "This is two things: a todo and a calorie log.
     Let me call todo_tools.create('edit video')
     then calorie_tools.log('200g chicken breast')."
  → Reply: "✅ Added: edit video\n🍗 Logged: 200g chicken breast (~330 kcal)"
```

### 3.2 Web UI Data Flow

```
User action (click, form submit)
  → Next.js client component
  → lib/api.ts fetch() to FastAPI REST endpoint
  → FastAPI route handler
  → Service layer (business logic)
  → Database query (SQLAlchemy)
  → JSON response back to frontend
  → React state update (SWR cache)
  → UI re-render
```

### 3.3 Brain Q&A Flow

```
User: "what's my biggest obstacle?"
  → Intent classifier → brain_question
  → llm/brain_qa.py:
    1. Embed the question (via LLM embedding model)
    2. pgvector similarity search on brain_documents.embedding
    3. Top-5 chunks returned
    4. LangChain QA chain: question + chunks → LLM
    5. LLM synthesizes answer from context
  → Reply formatted and sent to WhatsApp
```

---

## 4. Integration Architecture

### 4.1 External Systems Map

| System | Integration Type | Protocol | Data Direction | Authentication |
|--------|-----------------|----------|----------------|----------------|
| **WhatsApp Cloud API** | Webhook (inbound) + REST (outbound) | HTTPS | Bidirectional | App secret verification + access token |
| **Gemini API** | REST API call | HTTPS | Outbound only | API key in header |
| **Neon (PostgreSQL)** | Database connection | PostgreSQL wire | Bidirectional | SSL + password auth |
| **Vercel** | Static hosting + optional SSR | HTTPS | Frontend serves to browser | None (public) |

### 4.2 No Internal Message Queue (MVP)

For MVP, all processing is synchronous within the FastAPI request lifecycle. This means:
- WhatsApp webhook response is sent after LLM classification AND reply
- If LLM is slow, the webhook response is slow
- Acceptable for MVP given <5s target

**Future consideration:** Extract LLM inference to a background task queue (Celery/Redis or LangGraph) if latency becomes an issue.

---

## 5. High-Level Data Strategy

### 5.1 Source of Truth

**PostgreSQL** is the single source of truth for all persistent data. No caching layer for MVP.

### 5.2 Data Consistency

| Scenario | Strategy |
|----------|----------|
| **Todo complete + XP award** | Wrapped in a single database transaction. If XP award fails, todo completion rolls back |
| **Daily calorie reset** | Not a data reset — queries filter by `logged_at::date = CURRENT_DATE`. No data mutation needed |
| **Streak calculation** | Computed from `last_activity_date` on `user_stats` + `xp_events` |
| **Quest progress** | Computed from `todos` status + campaign file parsing (not stored directly) |

### 5.3 Vector Strategy

| Aspect | Detail |
|--------|--------|
| **Embedding model** | Gemini embedding or Hugging Face `all-MiniLM-L6-v2` |
| **Vector dimension** | 768 (Gemini) or 384 (MiniLM) |
| **Index type** | IVFFlat with `lists = 100` for sub-100ms search |
| **Chunking** | Markdown files split by `##` headings, 500-char chunks with 50-char overlap |

### 5.4 No Caching (MVP)

No Redis or in-memory cache. All reads hit PostgreSQL. For single-user, this is negligible.

---

## 6. Infrastructure View

### 6.1 Deployment Topology

```
Internet
    │
    ├──▶ Vercel Edge ──▶ Next.js Static SPA
    │       │
    │       └──▶ FastAPI REST API (HTTPS)
    │
    └──▶ WhatsApp Cloud API
            │
            └──▶ POST /api/whatsapp ──▶ FastAPI (Railway)
                                            │
                                            └──▶ PostgreSQL (Neon)
                                            │
                                            └──▶ Gemini API (Google)
```

### 6.2 Networking

| Connection | How |
|------------|-----|
| **User ↔ Vercel** | Public HTTPS, Vercel edge network |
| **Vercel ↔ Railway** | Public HTTPS, CORS configured |
| **WhatsApp ↔ Railway** | Public HTTPS webhook |
| **Railway ↔ Neon** | Private or public SSL connection |
| **Railway ↔ Gemini** | Public HTTPS outbound |

### 6.3 CI/CD Pipeline

```
GitHub Push (main)
    │
    ├──▶ Vercel: auto-deploy frontend/
    │     → Build Next.js
    │     → Deploy to preview/production
    │
    └──▶ Railway: auto-deploy backend/
          → Build Docker image
          → Run Alembic migrations (release command)
          → Deploy to production
```

---

## 7. Cross-Cutting Concerns

### 7.1 Logging

| Concern | Strategy |
|---------|----------|
| **Format** | Structured JSON via `structlog` |
| **Levels** | INFO for lifecycle events, WARNING for retries, ERROR for failures |
| **Sensitive data** | Never log message bodies or API keys. Log masked versions |
| **Destination** | Railway dashboard logs (stdout/stderr) |

### 7.2 Error Handling

| Layer | Strategy |
|-------|----------|
| **FastAPI** | Global exception handler → returns `{ error: { code, message } }` |
| **Service layer** | Custom exceptions caught by API handlers |
| **LLM layer** | Retry once on timeout, then return fallback response |
| **Database** | Session rollback on `IntegrityError` or `OperationalError` |

### 7.3 Security

| Concern | Implementation |
|---------|----------------|
| **Webhook verification** | SHA256 HMAC of request body compared to `X-Hub-Signature-256` |
| **API keys** | Environment variables, never hardcoded |
| **Frontend→Backend** | Static API token in `Authorization` header (env var both sides) |
| **CORS** | `allow_origins=[FRONTEND_URL]` in FastAPI middleware |

---

## 8. Interaction Diagrams

### 8.1 Add Task via WhatsApp (Agentic)

```
User                    WhatsApp          FastAPI              LLM         PostgreSQL
 │                        │                 │                  │              │
 │  "add task: edit vid"  │                 │                  │              │
 │───────────────────────▶│                 │                  │              │
 │                        │ POST /api/wh    │                  │              │
 │                        │────────────────▶│                  │              │
 │                        │                 │ verify signature │              │
 │                        │                 │ HTTP 200 (ack)   │              │
 │                        │◀────────────────│                  │              │
 │                        │                 │                  │              │
 │                        │                 │ build context    │              │
 │                        │                 │ (system prompt,  │              │
 │                        │                 │  history, streak)│              │
 │                        │                 │                  │              │
 │                        │                 │ ORCHESTRATOR     │              │
 │                        │                 │  "create todo    │              │
 │                        │                 │   'edit video'"  │              │
 │                        │                 │─────────────────▶│              │
 │                        │                 │  Tool: create    │              │
 │                        │                 │◀─────────────────│              │
 │                        │                 │                  │              │
 │                        │                 │ call todo_tools  │              │
 │                        │                 │───────────────────────────────▶│
 │                        │                 │ insert todo      │              │
 │                        │                 │◀───────────────────────────────│
 │                        │                 │                  │              │
 │                        │                 │ format reply     │              │
 │                        │ POST /messages  │                  │              │
 │                        │◀────────────────│  "✅ Added: edit vid"          │
 │                        │                 │                  │              │
 │  "✅ Added: edit vid"  │                 │                  │              │
 │◀───────────────────────│                 │                  │              │
```

### 8.2 Complete Task with XP Award (Agentic)

```
User                    WhatsApp          FastAPI              LLM         PostgreSQL
 │                        │                 │                  │              │
 │  "done edit vid"       │                 │                  │              │
 │───────────────────────▶│                 │                  │              │
 │                        │ POST /api/wh    │                  │              │
 │                        │────────────────▶│                  │              │
 │                        │                 │ verify           │              │
 │                        │                 │                  │              │
 │                        │                 │ ORCHESTRATOR     │              │
 │                        │                 │  "complete todo  │              │
 │                        │                 │   'edit vid',    │              │
 │                        │                 │   award XP"      │              │
 │                        │                 │─────────────────▶│              │
 │                        │                 │◀─────────────────│              │
 │                        │                 │                  │              │
 │                        │                 │ fuzzy match todo │              │
 │                        │                 │───────────────────────────────▶│
 │                        │                 │← todo found      │              │
 │                        │                 │                  │              │
 │                        │                 │ BEGIN TX         │              │
 │                        │                 │ update todo      │              │
 │                        │                 │───────────────────────────────▶│
 │                        │                 │ insert xp_event  │              │
 │                        │                 │───────────────────────────────▶│
 │                        │                 │ update stats     │              │
 │                        │                 │───────────────────────────────▶│
 │                        │                 │ COMMIT           │              │
 │                        │                 │                  │              │
 │                        │                 │ format reply     │              │
 │                        │ POST /messages  │                  │              │
 │                        │◀────────────────│  "+10 XP · Strk 3"             │
 │                        │                 │                  │              │
 │  "+10 XP · Streak 3d"  │                 │                  │              │
 │◀───────────────────────│                 │                  │              │
```

### 8.3 Calorie Summary via WhatsApp (Agentic with Sub-Agent)

```
User                    WhatsApp          FastAPI              LLM         PostgreSQL
 │                        │                 │                  │              │
 │  "how's my eating     │                 │                  │              │
 │   this week?"         │                 │                  │              │
 │───────────────────────▶│                 │                  │              │
 │                        │ POST /api/wh    │                  │              │
 │                        │────────────────▶│                  │              │
 │                        │                 │ ORCHESTRATOR     │              │
 │                        │                 │  "user asking    │              │
 │                        │                 │   about weekly   │              │
 │                        │                 │   calories ->    │              │
 │                        │                 │   delegate to    │              │
 │                        │                 │   Calorie Agent" │              │
 │                        │                 │─────────────────▶│              │
 │                        │                 │◀─────────────────│              │
 │                        │                 │                  │              │
 │                        │                 │ CALORIE SUB-AGENT:              │
 │                        │                 │  "get daily      │              │
 │                        │                 │   totals for     │              │
 │                        │                 │   last 7 days"   │              │
 │                        │                 │─────────────────▶│              │
 │                        │                 │◀─────────────────│              │
 │                        │                 │                  │              │
 │                        │                 │ query weekly     │              │
 │                        │                 │───────────────────────────────▶│
 │                        │                 │← 7 day totals    │              │
 │                        │                 │                  │              │
 │                        │                 │ sub-agent        │              │
 │                        │                 │ calculates avg,  │              │
 │                        │                 │ trend, insight   │              │
 │                        │                 │                  │              │
 │                        │                 │ returns to       │              │
 │                        │                 │ orchestrator     │              │
 │                        │                 │                  │              │
 │                        │                 │ format final     │              │
 │                        │ POST /messages  │                  │              │
 │                        │◀────────────────│  "📅 Weekly:     │              │
 │                        │                 │   Mon: 1800...   │              │
 │                        │                 │   Avg: 1829/d   │              │
 │                        │                 │   Trend: stable" │              │
 │                        │                 │                  │              │
 │  "📅 Weekly: ..."      │                 │                  │              │
 │◀───────────────────────│                 │                  │              │
```

---

**Next Step:** LLD — Low-Level Design (Class Design, DB Schema, Pseudocode)

*Draft for approval.*
