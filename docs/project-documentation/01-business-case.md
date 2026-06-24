---
document-type: business-case
status: draft
chapter: 0
created: 2026-06-24
---

# MyBrain — Business Case & Project Charter

> **Second Brain — Gamified Productivity with Local LLM Orchestration**

---

## Part 1: Business Case

### Executive Summary

MyBrain is a personal second-brain application that combines gamified task management with local LLM orchestration. It ingests the user's existing knowledge system (goals, campaigns, skill trees, psychological profile, gamification mechanics) and allows natural-language interaction via Telegram/WhatsApp. The MVP focuses on todo + gamification loops (XP, quests, rewards) with an LLM layer that understands context — logging calories, closing tasks, suggesting next actions.

The app transforms a passive markdown wiki into an active, conversational, game-like operating system for personal growth.

### Problem Statement

Current state:
- The user has an extensive personal wiki (60+ markdown files) with goals, campaigns, gamification systems, psychological profiles, and action plans — but it's **static**. No notifications, no interactivity, no automation.
- Todo lists, habit tracking, and calorie logging exist as separate mental contexts — fragmented.
- The user wants to interact naturally ("video edit done", "200g chicken breast") and have the system understand, log, and respond automatically.
- Existing tools (Habitica, Google Calendar, sticky notes) are disconnected from the deep personal context in the brain.

### Strategic Alignment

MyBrain directly supports **Project Freedom** — the $17K/mo by January 2028 goal. It:
- Eliminates friction between intention and action (LLM parses intent instantly)
- Gamifies execution (XP for completing todos, quests from the campaign)
- Keeps the user's psychological profile and obstacle map active (trigger logging, Evidence Log prompts)
- Scales to eventually serve the user's students/clients as a coaching tool

### Cost-Benefit Analysis (ROI)

| Item | Cost | Benefit |
|------|------|---------|
| Development time (100% free tools) | ~40h MVP | Eliminates context-switching between tools |
| Local LLM (Ollama) | $0 (runs on existing hardware) | Always-available context-aware assistant |
| Hosting (Vercel free tier / local) | $0 MVP | Accessible from anywhere |
| Turborepo + Next.js + Expo | $0 (open source) | Cross-platform (web + mobile) from one codebase |
| **ROI** | **$0 cash outlay** | Replaces $50+/mo in fragmented tools, saves 5-10h/week in logging/organizing |

---

## Part 2: Project Charter

### SMART Objectives

| Objective | Measure | Timeline |
|-----------|---------|----------|
| MVP: Todo + Gamification + LLM chat + WhatsApp/Telegram | User can add/complete todos via chat/web, earn XP, view quest log | **Iteration 1 (now)** |
| Calorie tracking via NLP | "200g chicken breast" → logged with nutrition data | Iteration 2 |
| Cloud sync | Multi-device access | Future |
| Multi-user release | Others can sign up and use it | Future |

### Scope & Boundaries

**In Scope (MVP):**
- Todo list with natural-language add/complete via chat interface
- Gamification system: XP rewards on completion, quest tracking, streak bonuses
- Local LLM integration (Ollama) for intent parsing and conversational responses
- **WhatsApp/Telegram bot** — receive messages, parse intent, respond in chat
- **Public API + webhooks** — deployed endpoint for messaging platforms to call
- Web UI (Next.js) + API backend
- SQLite storage (local or attached to deployment)

**Out of Scope (MVP):**
- Calorie tracking (Iteration 2)
- Mobile native app (Iteration 2 — Expo already scaffolded)
- Planner/milestones (Iteration 2+)
- Multi-user/auth (Future)
- Cloud sync (Future)

### Key Stakeholders

| Role | Person |
|------|--------|
| Product Owner & sole user | Karpinski94 |
| Developer | Karpinski94 |
| Future users | Students, clients, coaching customers |

### Milestone Schedule

| Milestone | Deliverable | Date |
|-----------|-------------|------|
| M1 | Business Case + BRD + FRD approved | Today |
| M2 | SRS + TRD + HLD drafted | Today |
| M3 | LLD + RTM complete | Today |
| M4 | MVP: Todo + Gamification + LLM + WhatsApp/Telegram bot + deployed API | First working version |

### Budget Estimate

| Resource | Cost |
|----------|------|
| Development tools (VS Code, Turborepo, Next.js, Expo) | $0 |
| LLM inference (Ollama local) | $0 |
| Hosting (Vercel free tier or localhost) | $0 |
| Database (SQLite) | $0 |
| **Total** | **$0** |

### Risk Log

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Local LLM too slow for real-time chat | Medium | Medium | Fallback to lightweight model (Phi-3, Llama-3.2-1B), async processing |
| Scope creep (too many features) | High | High | Strict MVP boundaries, defer everything to Iteration 2+ |
| Over-engineering the gamification system | Medium | Medium | Start simple: todo done = XP. Expand later. |
| SQLite sync complexity for future cloud | Low | Medium | Use a sync layer (e.g., SQLite → PostgreSQL sync) designed from the start |

### Success Criteria

- [ ] User can type "add task: edit Gabriel video" and it appears in the todo list
- [ ] User can type "done video" and it closes, awards XP, sends congrats
- [ ] User can type "200g chicken breast" → calories logged with nutritional info
- [ ] Daily/weekly XP streaks visible
- [ ] Quest log loads from the campaign structure
- [ ] Works on web + phone (Expo)

---

**Next Step:** BRD — Business Requirements Document

*Draft for approval. Awaiting user sign-off to proceed.*
