---
name: campaign-integration
description: "Compile all skill outputs into the character sheet, skill trees, quest log, financial roadmap, and create the campaign Chapter 0 summary"
---

# Campaign Integration: Compile & Update

## What This Does

This is the final skill that ties everything together. It reads the outputs from all previous 9 skills, extracts key insights, and updates your character sheet, skill trees, quest log, and financial roadmap. It also creates the Chapter 0 campaign summary note that becomes the anchor for Project Freedom.

## Prerequisites

Complete these skills first (their outputs must exist):
- past-childhood
- past-blocks
- past-release
- future-identity
- future-life
- goal-definition
- goal-obstacles
- goal-action-plan
- commitment-system

## Output

Updates to:
- `my-brain/02_Wiki/Character Sheet.md`
- `my-brain/02_Wiki/learning/Skill Trees.md`
- `my-brain/02_Wiki/projects/Financial Roadmap.md`
- `my-brain/02_Wiki/03_System/gamification/Quest Log.md`

Creates:
- `my-brain/02_Wiki/campaign/10-chapter-0-summary.md`

## Command Protocol

- **help** / **ask llm** — Get guidance on any step
- **save** — Save progress and exit
- **review** — Show compiled data before writing
- **done** — Finalize all updates

## Workflow

### Step 1: Read All Previous Outputs

Read the output files from each completed skill in `my-brain/02_Wiki/campaign/`:
- `01-childhood-patterns.md`
- `02-identity-shadows-blocks.md`
- `03-release-and-reclaim.md`
- `04-future-identity-emotions.md`
- `05-future-life-environment.md`
- `06-goal-definition.md`
- `07-obstacles-skills-resources.md`
- `08-action-plan-daily-systems.md`
- `09-commitment-system.md`

Wait for user confirmation before proceeding if files are missing.

### Step 2: Extract Key Data

Present the user with extracted highlights and ask for confirmation on each. Extract:

**From Past Skills (01-03):**
- Core childhood patterns identified
- Main inner blocks and self-sabotage patterns
- What they're releasing
- Declaration of who they're becoming

**From Future Self Skills (04-05):**
- Core values (3)
- Key character traits of future self
- Emotional baseline
- Key skills to develop
- Environmental changes needed
- Financial vision

**From Goal Skills (06-08):**
- Major Definite Purpose
- 3 most important goals
- Key deadlines
- #1 obstacle to solve
- One skill to master
- Daily non-negotiable actions
- Weekly review setup

**From Commitment Skill (09):**
- Keystone habit
- Accountability method
- Environmental changes
- Mission commitment

### Step 3: Update Character Sheet

Read the current `Character Sheet.md` and:
- Update Character Name / Title based on their declaration
- Update the Profile section with their current state
- Add their Major Definite Purpose to the Mission section
- Update stats (XP, Level) — ask if any quests were completed
- Add key traits identified to character description

### Step 4: Update Skill Trees

Read current `Skill Trees.md` and:
- Map skills identified to existing skill trees (Mindset, Business, Sales, Health, Finance, Relationships, Learning, Discipline, Creativity)
- Suggest XP allocations based on identified strengths
- Note skill gaps identified as obstacles

### Step 5: Update Financial Roadmap

Read current `Financial Roadmap.md` and:
- Add the specific savings/income goals from goal-definition
- Update chapter milestones with deadlines
- Add the obstacle elimination plan
- Add the skill-to-learn for financial growth

### Step 6: Update Quest Log

Read current `Quest Log.md` and:
- Convert the Major Definite Purpose into a Main Quest
- Convert key milestones into Side Quests
- Set XP rewards for each quest
- Add any active quests

### Step 7: Create Chapter 0 Summary

Create `10-chapter-0-summary.md` at `my-brain/02_Wiki/campaign/` containing:

```markdown
# Chapter 0: The Awakening

## Campaign Overview
Project Freedom — From $9K to $1M

## Who I Am Becoming
[Declaration from past-release]

## My Core Values
[3 values from future-identity]

## My Major Definite Purpose
[From goal-definition]

## My Three Most Important Goals
1. [Goal 1]
2. [Goal 2]
3. [Goal 3]

## My Origin Story
[Brief summary of key childhood patterns and blocks]

## What I Released
[What they chose to leave behind]

## My Future Self
[Brief description of future identity and daily life]

## The Obstacles Ahead
[#1 obstacle and how to overcome it]

## The Skill I Must Master
[One skill to develop]

## My Daily Non-Negotiables
[3-6 daily actions]

## My Commitment
[Mission statement / commitment declaration]

## Active Quests
[List of quests from quest log update]

## Financial Target
[$ goal and deadline]

---

*"Burn the escape routes. This is my time."*
```

### Step 8: Present Summary & Confirm

Show the user a summary of all changes that will be made. Ask for confirmation before writing any files. Allow them to make edits to individual sections.

### Step 9: Write All Updates

Once confirmed, write/update all files. Mark this skill as complete.
