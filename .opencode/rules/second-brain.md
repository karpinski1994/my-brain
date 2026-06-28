# Second Brain Vault Schema

## Purpose & Identity
This vault is a persistent, compounding knowledge base using the Karpathy LLM Wiki pattern. The agent acts as the wiki maintainer. Obsidian is the viewer.

## Folder Structure
- `my-brain/01_Raw/` — immutable source documents. READ only, never edit.
- `my-brain/02_Wiki/` — AI-generated markdown pages. The agent writes, the user reads.
- `my-brain/02_Wiki/index.md` — catalog of all wiki pages with descriptions and tags.
- `my-brain/02_Wiki/log.md` — chronological record of all ingest/save/lint operations.

## Page Formatting Rules
- Every wiki page must have a summary at the top (1-3 sentences).
- Every claim must reference its specific source (file path in `my-brain/01_Raw/`).
- Pages must link to related concepts using `[[wikilink]]` or `[markdown link](path)` syntax.
- Use YAML frontmatter: `---\ntags: [tag1, tag2]\ncreated: YYYY-MM-DD\nupdated: YYYY-MM-DD\n---`
- One concept per page. If a page grows too long, split it.

## Ingest Workflow
1. Read new source from `my-brain/01_Raw/` or wherever the user specifies.
2. Extract key concepts, entities, people, tools, claims.
3. For each concept: create a new page in `my-brain/02_Wiki/` or update an existing one.
4. Update `my-brain/02_Wiki/index.md` with any new pages.
5. Append to `my-brain/02_Wiki/log.md`: timestamp, source file, list of pages touched.

## Lint Workflow
1. Scan all `.md` files in `my-brain/02_Wiki/` recursively.
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
- Consult `my-brain/02_Wiki/` first before using general training data.
- Cite specific wiki page paths in answers.
- State when information is uncertain or contradictory.
- Never edit raw source files in `my-brain/01_Raw/`.
- Never delete wiki pages without user confirmation.
