---
name: kb-ingest
description: Ingest new source material from 01_Raw/ into the wiki — extract concepts, create/update wiki pages, update index.md and log.md
---

# KB Ingest — Process Raw Sources into Wiki Pages

## When to Use

Use this skill when the user says:
- "ingest this" / "process this source"
- "I added a new file to 01_Raw"
- "update the wiki from my recent notes"
- "add this article/clip/transcript to the wiki"

## Workflow

### Step 1: Identify the Source

Ask the user which file to ingest, or scan `my-brain/01_Raw/` for files newer than the last log entry in `02_Wiki/log.md`.

If the user specifies a path, resolve it relative to the repo root. Accept any file under `my-brain/01_Raw/`.

### Step 2: Read the Source

Read the full source file content. Sources may be:
- Markdown (`.md`) — worksheets, notes, ingested articles
- Plain text (`.txt`) — transcripts, raw clippings
- PDFs (use a reader tool)

### Step 3: Extract Key Information

Identify and extract:
- **Core concepts** — central ideas or themes
- **Entities** — people, organizations, tools, systems
- **Claims** — specific assertions or findings
- **Relationships** — how concepts connect to each other

### Step 4: Check Existing Wiki

Search `02_Wiki/` for existing pages that are related. Read any that match. Decide what needs to be:
- **Created** — new page for a concept not yet covered
- **Updated** — existing page that needs new information added
- **Merged** — if new info conflicts with or supersedes old info, add a note about the update

### Step 5: Create/Update Wiki Pages

For each new page, create `02_Wiki/<concept-name>.md`:

```markdown
---
tags: [concept, source-<name>]
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources:
  - path: 01_Raw/<path>
    title: <source title>
---

# <Concept Name>

<1-3 sentence summary>

## Summary

<Detailed summary of what this concept means and why it matters>

## Key Claims

- <Claim 1> (source: [[source path]])
- <Claim 2> (source: [[source path]])

## Related Concepts

- [[Related Page 1]]
- [[Related Page 2]]

## Source

Extracted from: `01_Raw/<path>`
```

For existing pages, append new information under a `## Updates` section or integrate into the body, preserving source citations.

### Step 6: Update `02_Wiki/index.md`

1. Read the current index
2. For each new page created, add a row:
   ```
   | [[Page Name]] | Brief description | tag1, tag2 | YYYY-MM-DD |
   ```
3. For each updated page, update the "Last Updated" column
4. Update the `updated` and `total_pages` frontmatter fields
5. Write the file

### Step 7: Log the Operation

Append to `02_Wiki/log.md`:

```
| YYYY-MM-DD HH:MM | ingest | <source filename> | <list of pages touched> |
```

Update the `updated` and `entries` frontmatter fields in log.md. Write the file.

## Rules

- **NEVER edit or modify files in `01_Raw/`** — they are immutable source documents
- **NEVER delete a wiki page** without asking the user first
- **Cite sources on every claim** — use the source file path
- **Link related pages** with `[[wikilink]]` syntax
- **One concept per page** — if a new concept emerges, create a new page

## Completion

Report to the user:
```
📥 Ingested: <source>
Pages created: <count>
Pages updated: <count>
```

Then ask: "Should I lint the wiki afterwards to check for issues?"
