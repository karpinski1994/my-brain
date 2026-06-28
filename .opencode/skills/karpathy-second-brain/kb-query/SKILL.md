---
name: kb-query
description: Answer questions using the second brain wiki — synthesize from wiki pages, cite sources, flag uncertainty
---

# KB Query — Ask the Wiki Knowledge Base

## When to Use

Use this skill when the user asks a question that should be answered from the accumulated wiki knowledge, such as:
- "what does the wiki say about X"
- "query the brain about Y"
- "based on my notes, what is..."
- "according to the second brain, ..."
- Any research or knowledge question about topics stored in the vault

## Workflow

### Step 1: Understand the Question

Parse the user's question. Identify:
- The main topic or entity
- Any specific angle or subtopic
- Whether the question is factual ("what is X"), comparative ("how does X differ from Y"), or exploratory ("what do I know about X")

### Step 2: Search the Wiki

Use grep to search `02_Wiki/` for relevant pages:
- Search for the topic name, related keywords, synonyms
- Read `02_Wiki/index.md` for page descriptions matching the topic
- Read the most relevant 3-5 pages in full

If the initial search yields no results:
- Try broader terms or alternative phrasings
- Inform the user that the wiki has no direct content on this topic, and note whether the raw source material in `01_Raw/` contains any related information

### Step 3: Synthesize the Answer

From the pages you read:
- Identify key claims and facts relevant to the question
- Note where pages agree or disagree
- Trace claims back to their original sources (`01_Raw/` paths)

### Step 4: Answer with Citations

Present the answer in this format:

```
Based on the wiki:

[Answer synthesized from wiki pages]

**Sources:**
- `02_Wiki/PageA.md` — [brief note on relevance]
- `02_Wiki/PageB.md` — [brief note on relevance]
```

### Step 5: Flag Issues

If the answer has any of these issues, flag them explicitly:
- **Uncertainty:** "The wiki mentions X but does not specify Y"
- **Contradiction:** "Page A says X, but Page B says not X — this may need linting"
- **Gap:** "This topic is mentioned in passing but doesn't have its own page yet"
- **Stale:** "The latest information was added N months ago and may be outdated"

### Step 6: Suggest Compounding

If the query produced a useful synthesis or comparison, suggest:
"This analysis could be saved as a new wiki page. Would you like to run `kb-save` to capture it?"

## Rules

- **Consult the wiki first** — do not default to general knowledge
- **Cite specific pages** — always include file paths
- **Flag uncertainty** — never pretend to know something the wiki doesn't cover
- **Be concise** — answer directly, then offer to elaborate

## Example

User: "What do I know about cybernetics and motivation?"

Agent:
```
Based on the wiki:

The vault covers cybernetic motivation theory across 14 lecture transcripts. Key concepts include:
- The 12 motivations matrix that drives human behavior (`02_Wiki/12-Motywacji.md`)
- The concept of "Free Power" and accumulators (`02_Wiki/Moc-Swobodna-Akumulator.md`)
- The 5 stages of life and character dynamism (`02_Wiki/5-Etapow-Zycia.md`)

These all reference the cybernetics lecture series in `01_Raw/data/learning/cybernetics/`.

**Sources:**
- `02_Wiki/12-Motywacji.md`
- `02_Wiki/Moc-Swobodna-Akumulator.md`
- `02_Wiki/5-Etapow-Zycia.md`
```
