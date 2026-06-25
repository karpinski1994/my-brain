---
document-type: frd
status: draft
chapter: 0
created: 2026-06-24
---

# MyBrain — Functional Requirements Document

> **Second Brain — Gamified Productivity with Local LLM Orchestration**

> **ℹ️ MVP Implementation Note:** The current MVP is implemented as an opencode skill with file-based markdown storage (see `.opencode/skills/mybrain/`). This document describes the target architecture for the full production deployment. The skill's file formats are designed to map directly to the database schemas defined here.

---

## 1. Functional Overview

MyBrain is a single-user WhatsApp bot + web dashboard that accepts natural-language messages, classifies intent via a local LLM (Ollama), and performs actions: todo CRUD, calorie logging, XP/quest tracking, and brain-context Q&A. All data is stored in SQLite.

---

## 2. User Personas & Roles

### The Architect (MVP — sole user)

| Attribute | Detail |
|-----------|--------|
| **Role** | Single user with full access to all features |
| **Permissions** | Create/read/update/delete all entities (todos, calories, quests) |
| **Auth** | None (single-user MVP; no login, no multi-tenancy) |
| **Interfaces** | WhatsApp bot (primary), Web UI (secondary) |

No secondary roles exist for MVP. The system is architected as single-user only.

---

## 3. User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|-------------|-----------|----------|
| US-01 | User | Send "add task: <description>" via WhatsApp | a new todo is created in my list | P0 |
| US-02 | User | Send "done <task>" via WhatsApp | the task is marked complete and I earn XP | P0 |
| US-03 | User | Send "delete <task>" via WhatsApp | the task is removed from my list | P0 |
| US-04 | User | Send "list todos" via WhatsApp | I see all pending tasks | P0 |
| US-05 | User | View all todos on the web UI | I can browse and manage tasks visually | P0 |
| US-06 | User | Edit a todo's title, description, priority, or tags via web UI | I can update task details after creation | P0 |
| US-07 | User | Add subtasks to a todo | I can break complex tasks into steps | P1 |
| US-08 | User | Send "200g chicken breast" via WhatsApp | the calories are logged with approximate nutrition | P1 |
| US-09 | User | View calorie log on the web UI | I can see what I ate and daily totals | P1 |
| US-09b | User | See my daily calorie intake and remaining vs goal on the web UI | I know how much I can still eat today | P1 |
| US-09c | User | Send "calorie summary" via WhatsApp | I get my daily total, remaining goal, and recent entries | P1 |
| US-09d | User | Send "weekly calories" via WhatsApp | I get a weekly overview (daily totals, average, trend) | P1 |
| US-09e | User | See weekly calorie summary on the web UI | I can spot patterns in my eating habits | P1 |
| US-09f | User | Have my daily calorie count reset automatically each day | I start fresh without manual intervention | P1 |
| US-10 | User | Complete a quest step | I earn associated XP and see quest progress | P0 |
| US-11 | User | View quest log on the web UI | I see all active quests and their progress | P0 |
| US-12 | User | Ask "what is my #1 goal?" via WhatsApp | the LLM answers from my brain context | P1 |
| US-13 | User | See my XP total and streak on the web UI | I stay motivated by visible progress | P0 |
| US-14 | User | Receive my current XP and streak via WhatsApp | I can check progress on the go | P0 |

---

## 4. Functional Requirements (System Shall)

### 4.1 WhatsApp Communication

| ID | Requirement | Priority |
|----|------------|----------|
| FR-01 | The system shall expose a public HTTPS endpoint that receives incoming WhatsApp messages via WhatsApp Cloud API webhooks | P0 |
| FR-02 | The system shall verify the incoming webhook signature against the WhatsApp app secret before processing | P0 |
| FR-03 | The system shall respond to the webhook with HTTP 200 within 5 seconds to avoid WhatsApp retries | P0 |
| FR-04 | The system shall send response messages back to the user via the WhatsApp Business API | P0 |
| FR-05 | The system shall support text-only messages (no images, voice, or attachments for MVP) | P0 |

### 4.2 Orchestrator Agent

| ID | Requirement | Priority |
|----|------------|----------|
| FR-06 | The system shall pass each incoming WhatsApp message to an orchestrator agent that decides which tools to call based on the full conversation context | P0 |
| FR-07 | The orchestrator agent shall have access to tools: `create_todo`, `complete_todo`, `delete_todo`, `query_todos`, `log_calorie`, `query_daily_calories`, `query_weekly_calories`, `query_stats`, `query_quests`, `search_brain`, `check_stats` | P0 |
| FR-08 | The orchestrator agent may delegate complex tasks to specialized sub-agents (calorie analysis, deep brain Q&A, gamification advice) | P0 |
| FR-09 | If the LLM is unavailable, the system shall reply: "MyBrain LLM is currently unavailable. Please try again in a moment." | P0 |

### 4.3 Todo Management

| ID | Requirement | Priority |
|----|------------|----------|
| FR-10 | The system shall store todos with fields: `id`, `title`, `description` (optional), `priority` (low/medium/high), `tags` (string array), `status` (pending/completed), `xp_value`, `created_at`, `completed_at` | P0 |
| FR-11 | The system shall support subtasks via a `parent_id` field (self-referencing) | P1 |
| FR-12 | Creating a todo via WhatsApp shall assign `title` from message, default `priority` to medium, default `status` to pending | P0 |
| FR-13 | Completing a todo via WhatsApp shall set `status` to completed, set `completed_at` to now, and award XP | P0 |
| FR-14 | Deleting a todo via WhatsApp shall hard-delete the record | P0 |
| FR-15 | Listing todos via WhatsApp shall return pending todos grouped by priority | P0 |
| FR-16 | The web UI shall support full CRUD on todos with inline editing | P0 |
| FR-17 | The web UI shall support adding/removing subtasks | P1 |

### 4.4 Calorie Logging

| ID | Requirement | Priority |
|----|------------|----------|
| FR-18 | The system shall store calorie entries with fields: `id`, `food_name`, `calories` (integer), `logged_at`, `serving_size` (optional) | P1 |
| FR-19 | The system shall parse "200g chicken breast" → approximate calorie value using LLM knowledge or a local nutrition lookup | P1 |
| FR-20 | The web UI shall display a calorie log page showing entries grouped by day with daily totals | P1 |
| FR-21 | The web UI shall support manual entry and deletion of calorie logs | P1 |
| FR-21b | The system shall calculate daily calorie total by summing all entries with `logged_at` matching the current calendar day | P1 |
| FR-21c | The system shall support a configurable daily calorie goal (default 2000 kcal) stored in user settings | P1 |
| FR-21d | The system shall display on the web UI: daily total, goal, remaining, and percentage of goal consumed | P1 |
| FR-21e | The system shall reset daily intake tracking at midnight each day (based on local timezone) | P1 |
| FR-21f | The system shall expose a tool `query_daily_calories` that the orchestrator agent can call to get today's total, goal, remaining, and recent entries | P1 |
| FR-21g | The system shall expose a tool `query_weekly_calories` that the orchestrator agent can call to get per-day totals, daily average, and trend | P1 |
| FR-21h | The web UI shall have a weekly view showing daily totals as a bar chart or table with average | P1 |

### 4.5 XP & Gamification

| ID | Requirement | Priority |
|----|------------|----------|
| FR-22 | The system shall award XP when a todo is completed (base XP = priority-based: low=5, medium=10, high=20) | P0 |
| FR-23 | The system shall track consecutive daily activity (streak) and multiply XP by streak multiplier (streak ≥ 7 days = 1.5x, ≥ 30 = 2x) | P0 |
| FR-24 | The system shall store total XP per skill tree category (derived from todo tags) | P0 |
| FR-25 | The system shall store running total XP and current streak in a user stats table | P0 |
| FR-26 | The system shall reply with XP earned and current total when a todo is completed via WhatsApp | P0 |
| FR-27 | The system shall track quest completion status (loaded from campaign markdown files) | P0 |

### 4.6 Brain Context & Q&A

| ID | Requirement | Priority |
|----|------------|----------|
| FR-28 | On startup, the system shall ingest markdown files from a configured directory into LLM vector/context memory | P0 |
| FR-29 | The system shall support questions about brain content via WhatsApp (e.g., "what's my biggest obstacle?") | P1 |
| FR-30 | Answers shall be grounded in ingested content; if no relevant content found, reply "I don't have information on that in your brain" | P1 |

### 4.7 Web UI

| ID | Requirement | Priority |
|----|------------|----------|
| FR-31 | The web UI shall have navigation sections: Todos, Calorie Log, Quests, Stats | P0 |
| FR-32 | The web UI shall be a single-page application built with Next.js | P0 |
| FR-33 | The web UI shall update in real-time or support manual refresh (no WebSocket for MVP) | P0 |
| FR-34 | The web UI shall display XP total, current streak, and level on the dashboard | P0 |

---

## 5. Workflow & Logic

### 5.1 Incoming WhatsApp Message Flow (Agentic)

```
WhatsApp → Webhook (POST /api/whatsapp)
  → Verify signature
  → Extract text body & sender number
  → HTTP 200 (ack)

  → BUILD CONTEXT:
    a) Assemble system prompt: user goals, campaign phase, gamification rules
    b) Load recent history: last N todos, streak, last messages
    c) Optionally retrieve brain context if message seems like a question

  → ORCHESTRATOR AGENT LOOP:
    1. LLM receives message + context
    2. LLM decides which tool(s) to call (single or multiple)
    3. System executes tool call → returns structured result
    4. LLM evaluates: done? need another tool? delegate to sub-agent?
    5. If complex → delegate to sub-agent (calorie, brain, gamification)
    6. Repeat until orchestrator decides task is complete

  → FORMAT REPLY:
    1. Orchestrator formats natural-language response
    2. POST reply to WhatsApp Cloud API

Examples of what the orchestrator handles:

  "add task edit video"
    → creates todo → "✅ Added: edit video"

  "done edit video"
    → fuzzy-match, complete, award XP → "✅ Done: edit video (+10 XP, streak: 3 days)"

  "200g chicken breast"
    → estimate via LLM, log → "🍗 Logged: 200g chicken breast (~330 kcal)"

  "add task edit video and 200g chicken breast for lunch"
    → two tools in one turn → "✅ Added: edit video\n🍗 Logged: 200g chicken breast (~330 kcal)"

  "how's my eating this week?"
    → delegate to Calorie Sub-Agent → "📅 Weekly: Mon 1,800 ... Avg: 1,829 kcal/day · Stable"
```

### 5.2 Todo Fuzzy Matching (Tool)

The todo fuzzy match tool shall:
- Normalize both input and stored titles (lowercase, strip punctuation)
- Compute Levenshtein similarity
- If similarity > 0.8 → single match, auto-select
- If 0.5–0.8 → check for multiple candidates, ask user to disambiguate
- If < 0.5 → "No matching todo found"

---

## 6. Data Requirements

### 6.1 Entity: `todos`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | INTEGER | Auto | Primary key |
| title | TEXT | Yes | 1-200 chars |
| description | TEXT | No | Max 2000 chars |
| priority | TEXT | Yes | One of: low, medium, high. Default: medium |
| tags | TEXT | No | Comma-separated or JSON array |
| status | TEXT | Yes | One of: pending, completed. Default: pending |
| parent_id | INTEGER | No | Self-reference for subtask support |
| xp_value | INTEGER | Yes | Calculated from priority on creation |
| created_at | TEXT | Yes | ISO 8601 timestamp |
| completed_at | TEXT | No | ISO 8601 timestamp, null if pending |

### 6.2 Entity: `calorie_logs`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | INTEGER | Auto | Primary key |
| food_name | TEXT | Yes | What was eaten |
| calories | INTEGER | Yes | Estimated or user-entered |
| serving_size | TEXT | No | "200g", "1 cup", etc. |
| logged_at | TEXT | Yes | ISO 8601 timestamp |

### 6.3 Entity: `user_stats`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | INTEGER | Auto | Primary key, single row for MVP |
| total_xp | INTEGER | Yes | Running total, default 0 |
| current_streak | INTEGER | Yes | Consecutive days, default 0 |
| longest_streak | INTEGER | Yes | Historical max, default 0 |
| last_activity_date | TEXT | No | Date of last activity (YYYY-MM-DD) |

### 6.4 Entity: `xp_events`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | INTEGER | Auto | Primary key |
| source | TEXT | Yes | 'todo_complete', 'quest_complete', 'streak_bonus' |
| source_id | INTEGER | No | FK to todos.id or null |
| xp_awarded | INTEGER | Yes | Raw XP amount before multiplier |
| multiplier | REAL | Yes | Streak multiplier applied, default 1.0 |
| xp_total_awarded | INTEGER | Yes | Final XP after multiplier |
| skill_tree | TEXT | No | Derived from todo tags |
| created_at | TEXT | Yes | ISO 8601 timestamp |

---

## 7. UI/UX Functional Specs

### 7.1 Navigation

The web UI shall have a persistent top or side navigation with four sections:

| Section | Route | Description |
|---------|-------|-------------|
| Dashboard | `/` | XP total, streak, recent activity feed |
| Todos | `/todos` | Filterable/sortable todo list with create/edit inline |
| Calorie Log | `/calories` | Daily entries, daily total vs goal, weekly view with chart |
| Quests | `/quests` | Active quests from campaign with progress bars |

### 7.2 Layout Rules

- All pages shall use a consistent color scheme (dark mode default)
- Mobile-responsive layout (works on phone browser)
- No user authentication screens (single-user)
- Real-time updates via polling (configurable interval, default 30s) or manual refresh

---

## 8. Exception Handling

| Scenario | Behavior |
|----------|----------|
| Orchestrator agent loop timeout (>10s) | Reply: "I'm thinking about that, give me a moment..." then retry once. If still failing, reply with partial results |
| LLM unavailable | Reply: "MyBrain LLM is currently unavailable. Please try again in a moment." |
| Tool call fails (e.g., DB down) | Orchestrator retries once. If still fails, reply: "I ran into an issue with that. Please try again." |
| WhatsApp webhook signature invalid | Log warning, return HTTP 401, no processing |
| Todo fuzzy match returns no results | Orchestrator replies: "I couldn't find a todo matching that. Try asking me to list your todos." |
| Todo fuzzy match returns multiple | Orchestrator asks: "Which one did you mean? 1) ... 2) ..." |
| Invalid priority in web UI | Reject with validation error: "Priority must be low, medium, or high" |
| Calorie parsing fails | Orchestrator replies: "I couldn't estimate calories for that. Try being more specific (e.g., '200g chicken breast')" |
| Database write failure | Reply: "Something went wrong saving that. Please try again." Log error server-side |
| Message too long (>1000 chars) | Reply: "That message is too long. Please keep it under 1000 characters." |

---

## 9. Open Items

| # | Item | Decision Needed |
|---|------|----------------|
| 1 | Notification scheduling | How/when are daily summaries and streak reminders pushed? Explore cron vs manual vs user-requested |

---

**Next Step:** SRS — Software Requirements Specification (Formal Technical Specs)

*Draft for approval.*
