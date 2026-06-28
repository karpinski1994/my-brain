---
name: kb-save
description: Save chat insights, analysis, or discoveries as new wiki pages — ensure knowledge compounds in the second brain
---

# KB Save — Capture Insights into the Wiki

## When to Use

Use this skill when the user says:
- "save this to the wiki"
- "capture this insight"
- "digest this analysis"
- "make a page about this"
- "compound this knowledge"
- After a `kb-query` produced a useful synthesis
- After a conversation that generated new understanding

## Workflow

### Step 1: Clarify What to Save

If the user says "save this", determine what "this" refers to:
- The last response/analysis in the conversation
- A specific insight the user describes verbally
- A comparison or synthesis just produced

Ask clarifying questions if needed:
- "Should I save the full analysis or a summary?"
- "What should the page be titled?"
- "What tags should I use?"
- "Which existing pages does this relate to?"

### Step 2: Choose the Location

The new page goes into `02_Wiki/`. Determine the filename from the title:
- Use kebab-case: "Motivation and Cybernetics Comparison" → `02_Wiki/motivation-cybernetics-comparison.md`
- Keep names short but descriptive

### Step 3: Check for Existing Content

Search `02_Wiki/` for existing pages on the same or similar topic. If a page already exists:
- Ask: "A page on this topic already exists at `02_Wiki/ExistingPage.md`. Should I update it instead of creating a new one?"
- If the user says update, follow the kb-ingest update procedure instead

### Step 4: Create the Page

Write the new page following wiki conventions:

```markdown
---
tags: [insight, <relevant-tags>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
type: insight
---

# <Page Title>

<1-3 sentence summary>

## Insight

<The core insight, analysis, or synthesis>

## Context

<What prompted this insight — the question, conversation, or source>

## Connections

- Relates to: [[Related Page 1]]
- Relates to: [[Related Page 2]]
- Contradicts / Nuances: [[Related Page 3]] (explain how)

## Implications

<Why this matters, what follows from this insight>
```

### Step 5: Update `02_Wiki/index.md`

1. Read the current index
2. Add a row for the new page
3. Update the `updated` and `total_pages` frontmatter
4. Write the file

### Step 6: Backlink Existing Pages

For each related page listed in "Connections":
1. Read the related page
2. Add a backlink section if not present:
   ```markdown
   ## Referenced By
   - [[New Page Title]]
   ```
3. Or append to existing "Referenced By" section
4. Write the updated page

### Step 7: Log the Operation

Append to `02_Wiki/log.md`:

```
| YYYY-MM-DD HH:MM | save | <conversation context> | 02_Wiki/<new-page>.md |
```

Update `updated` and `entries` frontmatter. Write the file.

## Completion

Report:
```
💾 Saved: 02_Wiki/<page-name>.md
Backlinks added to: <count> existing pages
```

## Rule

- If the insight directly relates to a source in `01_Raw/`, add the source path to the page's frontmatter `sources` field
- Never save raw conversation without synthesis — distill the insight first
- Always link to at least one existing wiki page (compounding requires connections)
