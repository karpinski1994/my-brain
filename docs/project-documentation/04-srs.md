---
document-type: srs
status: draft
chapter: 0
created: 2026-06-24
---

# MyBrain — Software Requirements Specification

> **Second Brain — Gamified Productivity with Local LLM Orchestration**

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the technical, performance, security, and interface requirements for MyBrain MVP — a single-user WhatsApp bot + web dashboard that combines todo management, gamification (XP/quests/streaks), calorie tracking, and brain-context Q&A using an LLM backend.

### 1.2 Scope

The MVP covers:
- WhatsApp bot for natural-language task and calorie management
- Web UI (Next.js) for browsing and managing todos, calories, quests, and stats
- LLM integration for intent classification, calorie estimation, and brain Q&A
- Gamification engine (XP, streaks, quests)
- SQLite persistence
- Vercel serverless deployment

Out of scope: multi-user auth, cloud sync, mobile native app, notifications infrastructure.

### 1.3 Definitions

| Term | Definition |
|------|------------|
| **Intent** | Classified purpose of a user's natural-language message (create_todo, log_calories, etc.) |
| **LLM** | Large Language Model — used for classification, estimation, and Q&A |
| **XP** | Experience points awarded for task completion and streaks |
| **Quest** | Multi-step task loaded from campaign markdown structure |
| **Webhook** | HTTPS callback from WhatsApp Cloud API delivering user messages |
| **Vercel** | Serverless deployment platform for Next.js |

---

## 2. Overall Description

### 2.1 Product Perspective

MyBrain is a new standalone system with no legacy dependencies. It consists of:

```
┌─────────────┐     ┌──────────────────────────┐
│  WhatsApp    │────▶│  FastAPI Backend          │
│  Cloud API   │     │  (Railway Free)           │
└─────────────┘     │                            │
                    │  ┌──────────────────────┐  │
┌──────────────┐    │  │  Orchestrator Agent  │──│──▶ LLM (Gemini/HF)
│  Next.js     │    │  │  (decides, plans,    │  │
│  Frontend    │◀──▶│  │   delegates)         │  │
│  (Vercel)    │    │  └───────┬──────────────┘  │
└──────────────┘    │          │                  │
                    │  ┌───────▼──────────────┐  │
                    │  │  Tools               │  │
                    │  │  • Todo CRUD         │──│──▶ PostgreSQL + pgvector
                    │  │  • Calorie Log       │  │     (Neon Free)
                    │  │  • RAG Search        │  │
                    │  │  • Stats/Quests      │  │
                    │  └───────┬──────────────┘  │
                    │          │                  │
                    │  ┌───────▼──────────────┐  │
                    │  │  Sub-Agents          │  │
                    │  │  • Calorie Agent     │  │
                    │  │  • Brain Agent       │  │
                    │  │  • Gamification      │  │
                    │  │    Agent             │  │
                    │  └──────────────────────┘  │
                    └──────────────────────────┘
```

### 2.2 User Classes

| Class | Description |
|-------|-------------|
| **The Architect (sole user)** | Full access to all features via WhatsApp and web UI. No authentication tiers. |

### 2.3 Constraints

| Constraint | Detail |
|------------|--------|
| **Deployment** | Vercel serverless — functions have 10s timeout (Hobby), 60s (Pro). WhatsApp webhook must respond within 5s. |
| **Storage** | SQLite in `/tmp` (ephemeral on Vercel) or external via Turso/Cloudflare D1 for persistence across redeploys |
| **LLM** | Must use a free-tier LLM provider (Gemini API free tier, Hugging Face inference, or self-hosted Ollama) |
| **Agentic** | Backend architecture is agent-driven: orchestrator agent plans and executes tool calls, delegates to sub-agents |
| **Budget** | $0 operational cost for MVP |
| **Single-tenant** | No multi-user isolation required |

---

## 3. System Features

### 3.1 WhatsApp Communication

| ID | Requirement | Priority | Source |
|----|------------|----------|--------|
| SRS-001 | The system shall expose `POST /api/whatsapp` webhook endpoint for WhatsApp Cloud API | P0 | FR-01 |
| SRS-002 | The system shall verify webhook `X-Hub-Signature` using the app secret before processing | P0 | FR-02 |
| SRS-003 | The system shall respond HTTP 200 within 5 seconds to avoid WhatsApp retries | P0 | FR-03 |
| SRS-004 | The system shall send reply messages via WhatsApp Cloud API `POST /{{phone-number-id}}/messages` | P0 | FR-04 |
| SRS-005 | The system shall support text-only incoming messages for MVP | P0 | FR-05 |

### 3.2 Intent Classification

| ID | Requirement | Priority | Source |
|----|------------|----------|--------|
| SRS-006 | The system shall pass each incoming message to an orchestrator agent that decides actions via tool calls | P0 | FR-06 |
| SRS-007 | The orchestrator agent shall have tools for: todo CRUD, calorie log, daily/weekly calorie query, stats, quests, brain search | P0 | FR-07 |
| SRS-008 | The orchestrator agent may delegate complex tasks to specialized sub-agents (calorie, brain, gamification) | P0 | FR-08 |
| SRS-009 | If the LLM is unavailable, the system shall reply: "MyBrain LLM is currently unavailable. Please try again in a moment." | P0 | FR-09 |

### 3.3 Todo Management

| ID | Requirement | Priority | Source |
|----|------------|----------|--------|
| SRS-010 | The system shall support CRUD on todos via WhatsApp and web UI | P0 | FR-10–FR-16 |
| SRS-011 | Todo entity fields: `id`, `title`, `description`, `priority` (low/medium/high), `tags`, `status` (pending/completed), `xp_value`, `created_at`, `completed_at`, `parent_id` | P0 | FR-10 |
| SRS-012 | Subtask support via `parent_id` self-reference | P1 | FR-11 |
| SRS-013 | WhatsApp todo matching shall use Levenshtein similarity (threshold 0.8 auto, 0.5–0.8 disambiguate, < 0.5 not found) | P0 | FR-13–FR-15 |

### 3.4 Calorie Logging

| ID | Requirement | Priority | Source |
|----|------------|----------|--------|
| SRS-014 | The system shall support calorie entry via WhatsApp NLP and web UI manual entry | P1 | FR-18–FR-21 |
| SRS-015 | Calorie entity fields: `id`, `food_name`, `calories`, `serving_size`, `logged_at` | P1 | FR-18 |
| SRS-016 | The system shall calculate and display daily total, goal, remaining, and percentage | P1 | FR-21b–FR-21d |
| SRS-017 | Daily intake resets at midnight (configurable timezone) | P1 | FR-21e |
| SRS-018 | The system shall expose tools `query_daily_calories` and `query_weekly_calories` callable by the orchestrator agent | P1 | FR-21f–FR-21g |
| SRS-019 | The system shall support a configurable daily calorie goal (default 2000 kcal) | P1 | FR-21c |

### 3.5 Gamification

| ID | Requirement | Priority | Source |
|----|------------|----------|--------|
| SRS-020 | Completing a todo awards XP (low=5, medium=10, high=20) | P0 | FR-22 |
| SRS-021 | Streak tracking: consecutive daily activity with XP multiplier (≥7d = 1.5x, ≥30d = 2x) | P0 | FR-23 |
| SRS-022 | XP tracked per skill tree (derived from todo tags) and as running total | P0 | FR-24–FR-25 |
| SRS-023 | WhatsApp reply includes XP earned and streak on todo completion | P0 | FR-26 |

### 3.6 Brain Context & Q&A

| ID | Requirement | Priority | Source |
|----|------------|----------|--------|
| SRS-024 | The system shall ingest markdown files from a configured directory on startup | P0 | FR-28 |
| SRS-025 | The system shall support brain-context Q&A via WhatsApp | P1 | FR-29 |
| SRS-026 | If no relevant content found, reply: "I don't have information on that in your brain" | P1 | FR-30 |

### 3.7 Web UI

| ID | Requirement | Priority | Source |
|----|------------|----------|--------|
| SRS-027 | The web UI shall have four sections: Dashboard, Todos, Calorie Log, Quests | P0 | FR-31 |
| SRS-028 | The web UI shall be built with Next.js (App Router) | P0 | FR-32 |
| SRS-029 | The web UI shall support manual refresh (no WebSocket for MVP) | P0 | FR-33 |
| SRS-030 | The dashboard shall display XP total, current streak, and level | P0 | FR-34 |

---

## 4. External Interface Requirements

### 4.1 User Interfaces

- **WhatsApp bot**: Text-only. No rich UI elements (buttons, lists, carousels for MVP).
- **Web UI**: Next.js SPA with dark mode default, mobile-responsive, no login screen.

### 4.2 Hardware Interfaces

- **LLM provider**: HTTPS calls to external API (Gemini, Hugging Face, or Ollama). No local hardware binding.

### 4.3 Software Interfaces

| Interface | Protocol | Format | Details |
|-----------|----------|--------|---------|
| WhatsApp Cloud API | HTTPS REST | JSON | Incoming: webhook POST with message object. Outgoing: POST /messages with text body |
| LLM Provider | HTTPS REST | JSON | Chat completions endpoint. TBD provider (Gemini free / HF inference / Ollama) |
| SQLite | File-based | SQL | Local file or Turso/Cloudflare D1 for hosted persistence |

### 4.4 Communication Interfaces

- **WhatsApp webhook**: HTTPS POST from WhatsApp Cloud API to `https://<domain>/api/whatsapp`
- **LLM calls**: HTTPS from Vercel serverless function to LLM provider API
- **WhatsApp replies**: HTTPS POST from Vercel to WhatsApp Cloud API

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement | Target |
|----|------------|--------|
| NFR-001 | WhatsApp message → classification + response | < 5 seconds p95 |
| NFR-002 | Web UI page load (initial) | < 3 seconds |
| NFR-003 | Web UI page load (subsequent) | < 1 second |
| NFR-004 | API route response time (no LLM) | < 200ms |
| NFR-005 | LLM classification inference | < 3 seconds |
| NFR-006 | Concurrent users | 1 (single-user MVP) |

### 5.2 Security

| ID | Requirement |
|----|------------|
| NFR-007 | WhatsApp webhook `X-Hub-Signature` shall be verified against the app secret before any processing |
| NFR-008 | The web UI shall have basic authentication (password or token) when deployed publicly |
| NFR-009 | LLM API keys (if any) shall be stored as environment variables, never in code |
| NFR-010 | WhatsApp app secret and phone number ID shall be stored as environment variables |

### 5.3 Reliability & Availability

| ID | Requirement |
|----|------------|
| NFR-011 | Vercel free tier availability target: 99.5% (as provided by Vercel SLA) |
| NFR-012 | LLM provider failure shall not crash the system — user receives fallback message |
| NFR-013 | SQLite persistence: data survives Vercel cold starts only if using external storage (Turso/D1). In `/tmp` mode, data is ephemeral. |

### 5.4 Maintainability & Scalability

| ID | Requirement |
|----|------------|
| NFR-014 | All LLM provider logic shall be behind an abstraction layer (single adapter interface) to swap providers without changing business logic |
| NFR-015 | All external IDs (intents, priorities, goal defaults) shall be configurable via environment variables or a config file |
| NFR-016 | The codebase shall use TypeScript with strict mode |
| NFR-017 | Database schema migrations shall be tracked via versioned SQL files |

### 5.5 Data

| ID | Requirement |
|----|------------|
| NFR-018 | No backup strategy for MVP — data loss is acceptable risk |
| NFR-019 | All timestamps stored as ISO 8601 UTC strings |

---

## 6. Regulatory Compliance

| ID | Requirement |
|----|------------|
| REG-001 | The system must comply with WhatsApp Cloud API terms of service (no spam, no automated bulk messaging) |
| REG-002 | No PII (personally identifiable information) of third parties is stored — single user owns all data |
| REG-003 | If using Gemini API, comply with Google AI Use Guidelines (prohibited use: no deception, no high-risk decisions) |

---

**Next Step:** TRD — Technical Requirements Document (Tech Stack & Infrastructure)

*Draft for approval.*
