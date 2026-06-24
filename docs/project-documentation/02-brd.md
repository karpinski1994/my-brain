---
document-type: brd
status: draft
chapter: 0
created: 2026-06-24
---

# MyBrain — Business Requirements Document

> **Second Brain — Gamified Productivity with Local LLM Orchestration**

---

## 1. Project Overview

MyBrain is a personal second-brain application that ingests the user's existing knowledge system (60+ markdown files covering goals, campaigns, skill trees, psychology, gamification mechanics) and exposes it through:

- A **WhatsApp bot** for natural-language interaction ("done video" → close todo + XP)
- A **web UI** (Next.js) for browsing tasks, quests, and progress
- A **local LLM** (Ollama) that understands context, logs calories, closes tasks, and responds conversationally
- A **gamification engine** that awards XP, tracks streaks, and manages quests

---

## 2. Business Objectives

| # | Objective | Measured By |
|---|-----------|-------------|
| 1 | Reduce friction between intent and action | Natural language → task done in <3 seconds |
| 2 | Replace fragmented tools (Habitica, notepad, calendar) | Single app covers todo + logging + gamification |
| 3 | Keep brain context active daily | User interacts via WhatsApp ≥5x daily |
| 4 | Scale to a coaching tool for students/clients | MVP works for 1 user, architected for multi-user |

---

## 3. Target Audience / User Personas

### Primary Persona: The Architect (MVP)

| Attribute | Detail |
|-----------|--------|
| **Name** | Karpinski94 — The Architect |
| **Context** | Entrepreneur, mentor, software engineer |
| **Needs** | Quick logging, gamified motivation, brain-as-context assistant |
| **Pain points** | Fragmented tools, static wiki, needs speed (WhatsApp) |
| **Tech comfort** | High — software engineer |
| **Daily usage** | 10-20 interactions via WhatsApp, 2-3 via web UI |

### Secondary Persona: Future Student/Client (Future)

| Attribute | Detail |
|-----------|--------|
| **Name** | Coaching client |
| **Context** | Developer from developing country, The Architect's student |
| **Needs** | Task tracking, progress visibility, mentor interaction |
| **Pain points** | Accountability, organization |
| **Tech comfort** | Medium |

---

## 4. Business Process Mapping

### As-Is (Current)

```
User has idea/need
  → Opens Habitica or notepad
  → Types/forgets to type
  → Later: opens separate calorie app
  → Later: checks static wiki for goals
  → No connection between actions and long-term goals
  → No automated reward/consequence
```

### To-Be (Target)

```
User sends WhatsApp message
  → MyBrain LLM classifies intent:
     "done video" → todo complete → XP awarded
     "200g chicken breast" → calories logged
     "add task: find mentor" → new todo created
  → If XP thresholds hit → level up notification + reward suggestion
  → Web UI shows updated quest log, streaks, todos
  → Daily/weekly summaries pushed to WhatsApp
```

---

## 5. High-Level Functional Needs

| ID | Capability | Priority | Description |
|----|-----------|----------|-------------|
| BR-01 | WhatsApp bot | P0 | Receive messages, parse intent, respond conversationally |
| BR-02 | Intent classification | P0 | LLM determines: todo CRUD, calorie log, question, or command |
| BR-03 | Todo management | P0 | Create, read, complete, delete tasks via chat + web UI |
| BR-04 | XP economy | P0 | Award XP on completion, track streaks, level up |
| BR-05 | Quest management | P0 | Load quests from campaign structure, track progress |
| BR-06 | Calorie logging | P1 | "200g chicken breast" → log with nutritional info, daily totals |
| BR-07 | Web dashboard | P0 | Browse tasks, view quests, see XP history, edit items |
| BR-08 | Brain context ingestion | P0 | Load 60+ markdown files into LLM context on startup |
| BR-09 | Brain chat (Q&A) | P1 | Ask "what's my #1 obstacle?" → answer from brain context |
| BR-10 | Notification push | P1 | Daily summary, streak reminders, level-up celebrations |

---

## 6. Financial / Operational Constraints

| Constraint | Detail |
|------------|--------|
| **Budget** | $0 — all open-source tools, free tiers, local inference |
| **LLM** | Ollama (local) — no API costs, user's own hardware |
| **Deployment** | Vercel free tier or self-hosted with public API endpoint |
| **Database** | SQLite (MVP) — zero operational cost |
| **WhatsApp** | WhatsApp Business API or WhatsApp Cloud API (free tier available) |
| **Hardware** | Must run LLM on consumer hardware (M-series Mac or equivalent) |

---

## 7. Glossary

| Term | Definition |
|------|------------|
| **XP** | Experience points — awarded for completing tasks, tracked per skill tree |
| **Quest** | A structured task with XP reward, often multi-step (from Quest Log) |
| **Streak** | Consecutive days of activity, multiplies XP |
| **Level up** | Threshold of total XP unlocks new rank, reward, or ability |
| **Brain context** | All ingested markdown files that the LLM uses to answer personally |
| **Intent** | The classified purpose of a user's natural-language message |
| **Campaign** | Financial/phases structure from the existing wiki |
| **Skill Tree** | Categorized progression system (Business, Marketing, Psychology, etc.) |

---

**Next Step:** FRD — Functional Requirements Document (User Stories & Workflows)

*Draft for approval.*
