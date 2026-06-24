# Wiki Note Schema

## Frontmatter
```yaml
---
tags: [comma-separated, tags]
created: YYYY-MM-DD
aliases: [alternate, names]
---
```

## Sections

Every wiki note should contain these sections in order:

### # Title (H1)
The concept name — clear, atomic, one concept per note.

### Summary
1-3 sentences describing the concept at a high level.

### Key Ideas
Bullet list of the most important points, insights, or facts.

### Details
Optional — deeper explanation, mechanisms, context.

### Related
At least [[wikilink]] connecting to other notes in the wiki.

---

## Naming Convention

- `Pascal Case.md` for concept notes (e.g., `Flow State.md`)
- `_Prefix.md` for meta-notes (e.g., `_Dashboard.md`, `_MOC.md`)
- Lowercase kebab-case for raw files (e.g., `transcript-2025-06-23.md`)

## Atomicity Rules

1. **One concept per note.** If a note covers two distinct ideas, split them.
2. **Link generously.** If you mention a concept that has its own note, wikilink it.
3. **No orphans.** Every note must link to at least one other note.
4. **No dead links.** If [[Target Note]] doesn't exist, either create it or remove the link.
