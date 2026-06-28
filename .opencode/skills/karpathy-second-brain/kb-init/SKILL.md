---
name: kb-init
description: Initialize the Karpathy LLM Wiki vault schema — creates .opencode/rules/second-brain.md, index.md, and log.md for the second brain knowledge management system
---

# KB Init — Initialize Second Brain Vault

## Purpose

Set up the "Layer 3: Schema" for the Karpathy LLM Wiki pattern, adapted for this vault. This is a one-time setup. Run this skill when you start a new vault or need to repair the schema.

## Folder Structure (already exists)

The vault uses these directories — do NOT change them:
- `my-brain/01_Raw/` — immutable raw sources (Layer 1)
- `02_Wiki/` — AI-generated wiki pages (Layer 2)

## What to Create

### 1. `.opencode/rules/second-brain.md`

Create this file with the following sections. This is the permanent "contract" between the user and the agent.

```markdown
# Second Brain Vault Schema

## Purpose & Identity
This vault is a persistent, compounding knowledge base using the Karpathy LLM Wiki pattern. The agent acts as the wiki maintainer. Obsidian is the viewer.

## Folder Structure
- `my-brain/01_Raw/` — immutable source documents. READ only, never edit.
- `02_Wiki/` — AI-generated markdown pages. The agent writes, the user reads.
- `02_Wiki/index.md` — catalog of all wiki pages with descriptions and tags.
- `02_Wiki/log.md` — chronological record of all ingest/save/lint operations.

## Page Formatting Rules
- Every wiki page must have a summary at the top (1-3 sentences).
- Every claim must reference its specific source (file path in `01_Raw/`).
- Pages must link to related concepts using `[[wikilink]]` or `[markdown link](path)` syntax.
- Use YAML frontmatter: `---\ntags: [tag1, tag2]\ncreated: YYYY-MM-DD\nupdated: YYYY-MM-DD\n---`
- One concept per page. If a page grows too long, split it.

## Ingest Workflow
1. Read new source from `01_Raw/` or wherever the user specifies.
2. Extract key concepts, entities, people, tools, claims.
3. For each concept: create a new page in `02_Wiki/` or update an existing one.
4. Update `02_Wiki/index.md` with any new pages.
5. Append to `02_Wiki/log.md`: timestamp, source file, list of pages touched.

## Lint Workflow
1. Scan all `.md` files in `02_Wiki/` recursively.
2. Check for broken internal links (links pointing to non-existent files).
3. Find orphan pages (zero inbound links from other wiki pages).
4. Identify contradictory claims across pages (surface for manual review).
5. Find concepts mentioned in pages that lack their own page.
6. Report findings in a structured format.

## Query Workflow
1. Search wiki pages relevant to the question (use grep or read index.md).
2. Synthesize answer citing specific pages and sources.
3. Explicitly flag uncertainty or contradictions.
4. If the query leads to a new insight, suggest running `kb-save`.

## Question Answering Behavior
- Consult `02_Wiki/` first before using general training data.
- Cite specific wiki page paths in answers.
- State when information is uncertain or contradictory.
- Never edit raw source files in `01_Raw/`.
- Never delete wiki pages without user confirmation.
```

### 2. `02_Wiki/index.md`

A catalog page with frontmatter and a table of all wiki pages:

```markdown
---
type: catalog
name: wiki-index
updated: YYYY-MM-DD
total_pages: 0
---

# Wiki Index

| Page | Description | Tags | Last Updated |
|------|-------------|------|--------------|
```

### 3. `02_Wiki/log.md`

A chronological changelog:

```markdown
---
type: log
name: wiki-log
updated: YYYY-MM-DD
entries: 0
---

# Wiki Change Log

| Date | Operation | Source | Pages Affected |
|------|-----------|--------|----------------|
```

## Verify

After creating these files, confirm:
- `.opencode/rules/second-brain.md` exists and has all 7 sections
- `02_Wiki/index.md` exists with proper frontmatter
- `02_Wiki/log.md` exists with proper frontmatter
