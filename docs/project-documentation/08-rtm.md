---
document-type: rtm
status: draft
chapter: 0
created: 2026-06-24
---

# MyBrain — Requirements Traceability Matrix

> **Second Brain — Gamified Productivity with Local LLM Orchestration**

---

## Traceability Matrix

| BR ID | Business Requirement | Priority | FR ID | SRS ID | Tech Component (LLD) | Validation Method | Status |
|-------|---------------------|----------|-------|--------|----------------------|-------------------|--------|
| BR-01 | WhatsApp bot — receive messages, parse intent, respond conversationally | P0 | FR-01 to FR-05 | SRS-001 to SRS-005 | `whatsapp/webhook.py`: webhook verify + receive, `whatsapp/client.py`: outgoing API, FastAPI `POST /api/whatsapp` | Integration test: webhook verify + receive + reply cycle | ✅ Covered |
| BR-02 | Intent classification — LLM determines: todo CRUD, calorie log, question, or command | P0 | FR-06 to FR-09 | SRS-006 to SRS-009 | `agent/orchestrator.py`: agent loop with tool-use, `agent/context.py`: context builder, `llm/provider.py`: LLM abstraction | Unit test: agent loop with mock LLM returns correct tool calls | ✅ Covered (now agentic, not hardcoded classification) |
| BR-03 | Todo management — create, read, complete, delete tasks via chat + web UI | P0 | FR-10 to FR-17 | SRS-010 to SRS-013 | `services/todo_service.py`: CRUD + fuzzy match, `agent/tools/todo_tools.py`: tool wrappers, `api/todos.py`: REST endpoints, `frontend/app/todos/`: UI | Unit: fuzzy match edge cases, Integration: API create → complete → delete flow | ✅ Covered |
| BR-04 | XP economy — award XP on completion, track streaks, level up | P0 | FR-22 to FR-27 | SRS-020 to SRS-023 | `services/stats_service.py`: XP award + streak + level calc, `agent/sub_agents/gamification_agent.py`: gamification advisor, `xp_events` + `user_stats` tables | Unit: streak increment/reset, multiplier, level curve, XP transaction rollback | ✅ Covered |
| BR-05 | Quest management — load quests from campaign structure, track progress | P0 | FR-27 | SRS-023 | `services/quest_service.py` (planned), `agent/tools/quest_tools.py`, `brain-docs/campaigns/` directory | Integration: load campaign markdown → parse quests → track completion | ✅ Covered |
| BR-06 | Calorie logging — "200g chicken breast" → log with nutritional info, daily totals | P1 | FR-18 to FR-21h | SRS-014 to SRS-019 | `services/calorie_service.py`: CRUD + daily/weekly aggregation, `agent/tools/calorie_tools.py`: tool wrappers, `agent/sub_agents/calorie_agent.py`: trend analysis, `calorie_logs` table | Unit: daily aggregation query, weekly trend calculation, Integration: log → daily summary → weekly summary | ✅ Covered |
| BR-07 | Web dashboard — browse tasks, view quests, see XP history, edit items | P0 | FR-31 to FR-34 | SRS-027 to SRS-030 | `frontend/`: Next.js with SWR, pages: Dashboard, Todos, Calories, Quests, `api/`: REST endpoints for CRUD | E2E: UI loads data from API, CRUD operations reflect in list | ✅ Covered |
| BR-08 | Brain context ingestion — load 60+ markdown files into LLM context | P0 | FR-28 | SRS-024 | `rag/ingester.py`: chunk + embed markdown, `brain_documents` table with pgvector, `llm/provider.py`: embedding generation | Integration: ingest directory → verify rows in brain_documents → verify vector search returns results | ✅ Covered |
| BR-09 | Brain chat (Q&A) — ask "what's my #1 obstacle?" → answer from brain context | P1 | FR-29, FR-30 | SRS-025, SRS-026 | `rag/retriever.py`: pgvector similarity search, `agent/tools/rag_tool.py`: tool wrapper, `agent/sub_agents/brain_agent.py`: multi-turn Q&A | Integration: embed query → search → verify top-3 chunks are relevant, E2E: WhatsApp question → answer from brain | ✅ Covered |
| BR-10 | Notification push — daily summary, streak reminders, level-up celebrations | P1 | — | — | — | — | ❌ Deferred to future iteration |

---

## Traceability Summary

| Metric | Count |
|--------|-------|
| Total Business Requirements | 10 |
| Fully Covered | 9 |
| Partial / Deferred | 1 (BR-10: Notification push) |
| Orphan Tech Features | 0 |
| Coverage Rate | 90% |

---

## Coverage Detail

### ✅ Fully Covered (9/10)

| Business Requirement | Primary Tech Component | Key Implementation |
|---------------------|----------------------|-------------------|
| BR-01 WhatsApp bot | `whatsapp/` | Webhook verify, message receive, outbound API, text-only support |
| BR-02 Intent classification | `agent/orchestrator.py` | Agentic loop with tool-use instead of hardcoded intent routing |
| BR-03 Todo management | `services/todo_service.py` | CRUD, Levenshtein fuzzy match, subtask support, web UI |
| BR-04 XP economy | `services/stats_service.py` | Priority-based XP, streak tracking with multiplier, level curve |
| BR-05 Quest management | `brain-docs/campaigns/` + quest tools | Campaign file parsing, progress tracking |
| BR-06 Calorie logging | `services/calorie_service.py` | NLP parsing, daily/weekly aggregation, goal tracking, web UI |
| BR-07 Web dashboard | `frontend/` | Next.js + SWR, 4 sections, dark mode, mobile-responsive |
| BR-08 Brain ingestion | `rag/ingester.py` | Heading-based chunking, LLM embedding, pgvector storage |
| BR-09 Brain Q&A | `rag/retriever.py` + brain sub-agent | Cosine similarity search, multi-turn Q&A, grounded answers |

### ❌ Deferred (1/10)

| BR ID | Requirement | Reason | Plan |
|-------|-------------|--------|------|
| BR-10 | Notification push (daily summary, streak reminders, level-up celebrations) | No cron/scheduler infrastructure in MVP — all interactions are user-initiated via WhatsApp or web UI | Future iteration: add cron job (or LangGraph scheduled tasks), push via WhatsApp template messages |

---

## Verification Matrix

| BR ID | Unit Test | Integration Test | E2E Test | Manual Review |
|-------|-----------|-----------------|----------|---------------|
| BR-01 | — | ✅ Webhook verify + receive + reply | ✅ WhatsApp message → response | ✅ Webhook signature verification |
| BR-02 | ✅ Agent loop with mock LLM | ✅ Agent → tool call → result | ✅ WhatsApp → orchestrator → tool → reply | ✅ Context builder assembly |
| BR-03 | ✅ Fuzzy match edge cases | ✅ API CRUD cycle | ✅ Web UI: create → edit → complete | ✅ Database state after operations |
| BR-04 | ✅ Streak increment/reset, multiplier | ✅ XP award + DB transaction | ✅ Complete todo → XP shown in UI | ✅ Level curve at boundaries |
| BR-05 | — | ✅ Campaign parse → quests in DB | ✅ Quest progress in UI | ✅ Quest data accuracy |
| BR-06 | ✅ Daily/weekly aggregation | ✅ Log → daily summary → weekly | ✅ Web UI calorie chart | ✅ Calorie estimation accuracy |
| BR-07 | ✅ SWR mutation | ✅ API returns correct data | ✅ Full navigation flow | ✅ Dark mode, mobile responsive |
| BR-08 | ✅ Chunking logic | ✅ Ingest → vector search returns | — | ✅ Document count matches files |
| BR-09 | — | ✅ Embed → search → top-k | ✅ WhatsApp Q&A from brain | ✅ Answer grounded in context |
| BR-10 | — | — | — | — |

---

## Coverage Gaps & Risks

| Gap | Risk | Mitigation |
|-----|------|------------|
| BR-10: No notification push | User must manually request summaries; no proactive reminders | All summary data accessible on-demand via WhatsApp intents and web UI |
| No multi-user auth | Single user only; cannot extend without auth layer | Architecture is single-user by design for MVP; auth layer planned for future |
| No data backup (NFR-018) | SQLite/PostgreSQL data loss if database corrupted | Neon provides point-in-time recovery; user can manually export via SQL dump |

---

**Next Step:** Campaign Integration — Chapter 0 Summary

*Draft for approval.*
