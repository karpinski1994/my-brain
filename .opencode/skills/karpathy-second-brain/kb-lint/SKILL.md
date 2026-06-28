---
name: kb-lint
description: Health-check the second brain wiki — find contradictions, orphan pages, broken links, missing pages, and stale claims
---

# KB Lint — Wiki Health Check

## When to Use

Use this skill when the user says:
- "lint the wiki"
- "check wiki health"
- "find contradictions"
- "clean up the wiki"
- "audit the knowledge base"

## Workflow

### Step 1: Scan All Wiki Pages

Use glob to find all `.md` files recursively under `02_Wiki/`. Exclude `index.md` and `log.md` from some checks (they are meta-pages).

Read each page's content. For each page, capture:
- Page title (from `# Heading` or frontmatter)
- All `[[wikilink]]` references (links to other pages)
- All markdown links `[text](path)` pointing to other wiki pages
- Key claims and assertions (look for bullet points under "Key Claims" or similar sections)

### Step 2: Check for Broken Internal Links

For every `[[wikilink]]` or `[text](path)` pointing to a wiki page:
- Resolve the target file path
- Check if the target file exists in `02_Wiki/`
- If not, flag as **broken link**

### Step 3: Find Orphan Pages

For every wiki page (excluding index.md and log.md):
- Check if any other wiki page links TO this page
- Search all other pages for `[[Page Name]]` or `[text](path/to/page)`
- If no inbound links exist, flag as **orphan page**

### Step 4: Identify Contradictions

This is a heuristic check — flag potential contradictions for manual review:
- Look for pages that mention the same concept with opposing claims
- Check for "Updates" sections that supersede earlier information
- Flag any page with significant overlap with another page (potential duplicate)

### Step 5: Find Missing Concept Pages

- Look for `[[Concepts]]` that don't resolve to an existing file
- These are concepts mentioned but lacking their own page

### Step 6: Report

Present the report in this structured format:

```
# Wiki Lint Report

## 🔗 Broken Links
- `02_Wiki/PageA.md` → `[[MissingPage]]` (line X)

## 👻 Orphan Pages (no inbound links)
- `02_Wiki/OrphanPage.md` — last updated YYYY-MM-DD

## ⚠️ Potential Contradictions / Duplicates
- `02_Wiki/PageA.md` and `02_Wiki/PageB.md` both cover <topic>
- Claim in `PageA.md` ("X") vs claim in `PageB.md` ("not X")

## 📄 Missing Concept Pages (referenced but don't exist)
- `[[ConceptX]]` — mentioned in `02_Wiki/SomePage.md`

## ✅ Healthy Pages
- N pages with no issues found
```

### Step 7: Offer to Fix

After presenting the report, ask:
- "Should I create pages for the missing concepts?"
- "Should I add backlinks to orphan pages where appropriate?"
- "Should I resolve the broken links?"

Do NOT make changes without user confirmation.

## Notes

- Run this periodically (weekly or after every 3-5 ingests)
- The lint is a health tool — fixing issues requires user approval
- Contradiction detection is heuristic — always present findings for user judgment
