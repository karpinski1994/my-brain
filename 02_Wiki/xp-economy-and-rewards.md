---
tags: [gamification, xp, rewards, system-design]
created: 2026-06-28
updated: 2026-06-28
sources:
  - path: 01_Raw/ingested/how to calculate xp for personal lvl up.md
    title: How to Calculate XP for Personal Level Up
  - path: 01_Raw/ingested/rewards.md
    title: Rewards System Design
  - path: 01_Raw/ingested/rewards shop.md
    title: Rewards Shop Setup
---

# XP Economy and Rewards

The mathematical and psychological design of a personal XP & leveling system, including point economy, experience curves, and a tiered rewards shop.

## Summary

A balanced point economy assigns XP based on cognitive resistance (not task volume) and uses polynomial or Fibonacci-style curves for leveling. Rewards are tiered (minor/moderate/major) and operate on a strict exchange: you must work before you play.

## XP Economy

### Point Values by Task Type
- Daily Quests: 1-10 XP
- Weekly Quests: 2-50 XP
- One-Off Projects / Boss Battles: 15-500+ XP
- Weighted XP: High-resistance tasks = 3x standard

### Multiplier Rules
- "First Strike": 2x for completing hardest task first
- "Combo Streak": bonus for uninterrupted work blocks
- D20 roll: random bonus rewards

### Experience Curves

**Square Relation**: `Level = constant × sqrt(XP)`, `XP = (Level/constant)^2`
**Polynomial (RPG style)**: `TotalXP = baseXP × (Level-1)^exponent`
- Common exponent: 1.3-1.5
- Example: `TotalXP = 100 × (Level-1)^1.5`
**Fibonacci-style**: `XP_for_next = (last_level + current_level) × 30`

## Rewards Shop

### Tier 1 — Minor (Low Cost)
- Guilt-free social media (10-15 min)
- Small treat / fancy coffee
- Micro-break (10-15 min)

### Tier 2 — Moderate (Medium Cost)
- 1-hour LoL session (25-50 XP)
- TV episode / YouTube
- Takeout night
- Power nap (45 min)

### Tier 3 — Major (High Cost)
- "Legendary" 3-hour guilt-free gaming
- Tech upgrades (keyboard, mouse)
- Experiences (concert, spa, travel)
- High-end apparel

### Variable Mechanics
- D20 roll: "Nat 20" = free Legendary Reward
- Dopamine Menu randomizer: scratch-off style surprises
- "Dodge" Roll: use XP to skip a missed habit penalty

## Related Concepts

- [[Personal-Gamification-System]]
- [[Gamification-Foundation]]
- [[Onboarding-Plan]]

## Source

Extracted from: `01_Raw/ingested/how to calculate xp for personal lvl up.md`, `01_Raw/ingested/rewards.md`, `01_Raw/ingested/rewards shop.md`
