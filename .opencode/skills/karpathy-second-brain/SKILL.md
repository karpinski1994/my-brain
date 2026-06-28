The provided sources detail two distinct yet evolving frameworks for personal knowledge management using Artificial Intelligence. The first is Andrej Karpathy’s "append-and-review" method, which focuses on a minimalist, manual system within a single text file to reduce cognitive load. This approach prioritizes chronological logging over complex folder structures, using simple text searches and periodic manual reviews to "rescue" important thoughts from sinking into the history of the note.

Building on this logic, the sources introduce more advanced AI-native workflows and tools, such as notetime and obsidian-second-brain. These systems automate the organization process by using Large Language Models to rewrite existing pages, resolve information contradictions, and synthesize new connections across raw data like transcripts and web clips. Rather than just retrieving data, these tools aim to create a compounding knowledge base that maintains itself through automated "linting" and scheduled agents. Ultimately, the sources illustrate a transition from passive digital note-taking to autonomous intelligence systems that actively curate and evolve an individual's personal or professional knowledge.

The Karpathy methodology, specifically the LLM Wiki pattern, shifts from traditional Retrieval-Augmented Generation (RAG)—where an AI retrieves chunks of data on the fly—to a persistent, compounding research artifact
. In this system, the AI acts as the programmer/maintainer, the wiki is the codebase, and Obsidian serves as the IDE/viewer
.
Step 1: Create the Three-Layer Architecture
The foundation of the system is a specific folder structure that separates raw data from AI-generated synthesis
.
Layer 1: Raw Sources (/raw folder): Store immutable documents here (PDFs, transcripts, articles)
. The AI reads these but never edits them
.
Layer 2: The Wiki (/wiki folder): This contains the AI-generated markdown files, including entity pages, concept summaries, and an index.md
. You read this; the LLM writes it
.
Layer 3: The Schema (CLAUDE.md): A configuration file at the root that tells the LLM the rules of the vault, naming conventions, and workflows
.
Step 2: Initialize the System (Delegation Prompt)
To begin, you must establish the "contract" between you and the AI agent (such as Claude Code)
. You can initialize the system by providing the AI with the core concept and asking it to build the necessary infrastructure
.
Needed Prompt (Initial Setup):
"I want to implement the LLM Wiki pattern as described by Andrej Karpathy. Please read the following architectural concept [Paste Karpathy Gist text] and create the necessary folder structure (/raw, /wiki) and the CLAUDE.md schema. Also, scaffold the core commands: /ingest, /lint, /query, and /save."
Step 3: Define Core Operations and Skills
The methodology relies on four primary operations, often implemented as "skills" or slash commands in tools like Claude Code
.
Ingest: Processes new sources, extracts concepts, and updates the wiki
.
Logic: Read /raw, summarize, update index.md, and create/update entity pages
.
Lint: A health check to find contradictions, orphan pages, or data gaps
.
Query: Asks questions against the accumulated wiki knowledge
.
Save/Digest: Captures recent chat history or weekly summaries back into the wiki so insights aren't lost
.
Step 4: The Ingestion Loop
Once the structure is set, you add sources (using tools like the Obsidian Web Clipper for articles) to the /raw folder
.
Needed Prompt (Ingesting):
"I just added a new source to the /raw folder. Please read it, extract key concepts and entities, and update the relevant pages in the /wiki. Update the index.md and log.md accordingly."
A single source might touch 10–15 wiki pages, ensuring that every new piece of information makes the entire knowledge base smarter
.
Step 5: Maintenance and "Linting"
To prevent the wiki from becoming messy or contradictory, you must periodically "lint" the vault
. The agent checks for "stale" claims where new data might supersede old information
.
Needed Prompt (Linting):
"Please lint the wiki. Look for contradictions between pages, orphan pages with no inbound links, and concepts that are mentioned but don't have their own page yet. Provide a report of inconsistencies."
Step 6: Querying and Compounding
When you ask the system a question, the LLM consults its pre-computed synthesis (the wiki) rather than just searching raw chunks
.
Needed Prompt (Querying):
"Using only the information in the /wiki, answer [Your Question]. If the information is uncertain or contradictory based on the sources, flag it. Cite the specific wiki pages used."
Compounding Step: If a query leads to a new insight or a complex comparison, you should command the AI: "Save this analysis as a new page in the wiki" to ensure the discovery compounds for future use


In the Karpathy methodology, the CLAUDE.md file serves as Layer 3: The Schema
. It is a configuration document and ruleset that transforms a generic LLM into a disciplined wiki maintainer by specifying the vault's structure, conventions, and workflows
.
A basic CLAUDE.md schema template typically includes the following five core sections:
1. Purpose and Identity
This section defines the mission of the knowledge base in a single line
. For example, it might state the wiki is for "researching renewable energy" or "planning a trip to Japan"
. This one-line customization tells the AI what the focus of all synthesized knowledge should be
.
2. Folder Structure
The schema explicitly defines the directory layout so the agent knows where to read and write
. This typically includes:
raw/: For immutable source documents (PDFs, transcripts, articles)
.
wiki/: For AI-generated markdown files, entity pages, and concept summaries
.
index.md / log.md: Locations for the content catalog and chronological record
.

HERE WE ALREADY HAVE STRUCTURE
3. The Ingest Workflow
This defines the step-by-step instructions the AI must follow when a new source is added
. A standard ingest workflow includes:
Reading the new document from the raw/ folder
.
Extracting key concepts, people, and tools
.
Updating or creating relevant wiki pages
.
Updating the index.md and logging the changes in log.md
.
4. Page Formatting Rules
These are the stylistic and structural conventions the AI must use for every wiki page to ensure consistency
. Common rules include:
Every page must have a summary at the top
.
Every claim must reference its specific source
.
Pages must actively link to related concepts (backlinks)
.
Specifications for YAML frontmatter (tags, dates, or metadata)
.
5. Question Answering Behavior
The schema sets the "rules of engagement" for how the AI interacts with you
. It specifies that the agent should:
Consult the wiki first before using general training data
.
Cite specific wiki pages in its answers
.
Explicitly state when information is uncertain or contradictory
.
Implementation Note
The CLAUDE.md file acts as the "contract" between the user and the agent
. Because it lives in the root of the vault, Claude Code reads it automatically upon opening the project, ensuring every session begins with the AI knowing the specific rules and naming conventions of your second brain