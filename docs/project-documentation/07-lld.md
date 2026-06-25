---
document-type: lld
status: draft
chapter: 0
created: 2026-06-24
---

# MyBrain — Low-Level Design

> **Second Brain — Gamified Productivity with Local LLM Orchestration**

---

## 1. Component Detailed Design

### 1.1 Backend Module Dependencies

```
main.py
├── config.py
├── database/engine.py
├── api/router.py
│   ├── api/todos.py → services/todo_service.py → database/models.py
│   ├── api/calories.py → services/calorie_service.py
│   ├── api/stats.py → services/stats_service.py
│   └── api/brain.py → rag/retriever.py
├── whatsapp/webhook.py
│   ├── whatsapp/client.py
│   └── agent/orchestrator.py
│       ├── agent/context.py
│       │   ├── services/stats_service.py
│       │   ├── rag/retriever.py
│       │   └── database/models.py
│       ├── agent/tools/todo_tools.py → services/todo_service.py
│       ├── agent/tools/calorie_tools.py → services/calorie_service.py
│       ├── agent/tools/stats_tools.py → services/stats_service.py
│       ├── agent/tools/rag_tool.py → rag/retriever.py
│       ├── agent/sub_agents/calorie_agent.py
│       ├── agent/sub_agents/brain_agent.py
│       └── agent/sub_agents/gamification_agent.py
└── llm/provider.py
```

### 1.2 FastAPI Application Entry Point

```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.engine import create_pool, close_pool
from app.api.router import api_router
from app.whatsapp.webhook import whatsapp_router
from app.rag.ingester import ingest_all_documents

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    pool = await create_pool(settings.database_url)
    app.state.pool = pool
    await ingest_all_documents(pool, settings.brain_docs_dir)
    yield
    # Shutdown
    await close_pool(pool)

app = FastAPI(title="MyBrain API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")
app.include_router(whatsapp_router, prefix="/api")
```

### 1.3 Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    gemini_api_key: str = ""
    huggingface_api_key: str = ""
    llm_provider: str = "gemini"  # gemini | huggingface | ollama
    ollama_base_url: str = "http://localhost:11434"

    whatsapp_app_secret: str
    whatsapp_phone_number_id: str
    whatsapp_access_token: str
    frontend_url: str

    daily_calorie_goal: int = 2000
    agent_system_prompt_file: str = "prompts/system.md"
    brain_docs_dir: str = "./brain-docs"
    max_conversation_history: int = 20

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 2. Class & Object Design

### 2.1 SQLAlchemy ORM Models

```python
# app/database/models.py
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, Date, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY, VECTOR
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

class Todo(Base):
    __tablename__ = "todos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    priority = Column(String(10), nullable=False, default="medium")  # low, medium, high
    tags = Column(JSON, default=list)
    status = Column(String(10), nullable=False, default="pending")  # pending, completed
    parent_id = Column(UUID(as_uuid=True), ForeignKey("todos.id"), nullable=True)
    xp_value = Column(Integer, nullable=False, default=10)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)

class CalorieLog(Base):
    __tablename__ = "calorie_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    food_name = Column(String(200), nullable=False)
    calories = Column(Integer, nullable=False)
    serving_size = Column(String(50))
    logged_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class UserStats(Base):
    __tablename__ = "user_stats"

    id = Column(Integer, primary_key=True, default=1)  # single row
    total_xp = Column(Integer, nullable=False, default=0)
    current_streak = Column(Integer, nullable=False, default=0)
    longest_streak = Column(Integer, nullable=False, default=0)
    last_activity_date = Column(Date, nullable=True)
    daily_calorie_goal = Column(Integer, nullable=False, default=2000)

class XPEvent(Base):
    __tablename__ = "xp_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(30), nullable=False)  # todo_complete, quest_complete, streak_bonus
    source_id = Column(UUID(as_uuid=True), nullable=True)
    xp_awarded = Column(Integer, nullable=False)
    multiplier = Column(Float, nullable=False, default=1.0)
    xp_total_awarded = Column(Integer, nullable=False)
    skill_tree = Column(String(50))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class BrainDocument(Base):
    __tablename__ = "brain_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(VECTOR(768), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class ConversationLog(Base):
    __tablename__ = "conversation_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String(20), nullable=False)  # user, assistant, tool_call, tool_result
    content = Column(Text, nullable=False)
    tool_name = Column(String(50))
    tool_input = Column(JSON)
    tool_output = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

### 2.2 Service Layer Classes

```python
# app/services/todo_service.py
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import select, update, delete, and_
from sqlalchemy.ext.asyncio import AsyncConnection

@dataclass
class TodoResult:
    id: str
    title: str
    description: str | None
    priority: str
    tags: list
    status: str
    xp_value: int
    created_at: str
    completed_at: str | None

class TodoService:
    def __init__(self, conn: AsyncConnection):
        self.conn = conn

    async def create(self, title: str, description: str | None = None,
                     priority: str = "medium", tags: list | None = None) -> TodoResult:
        xp_map = {"low": 5, "medium": 10, "high": 20}
        todo_id = uuid4()
        stmt = Todo.__table__.insert().values(
            id=todo_id, title=title, description=description,
            priority=priority, tags=tags or [],
            xp_value=xp_map.get(priority, 10)
        )
        await self.conn.execute(stmt)
        return await self.get_by_id(todo_id)

    async def get_by_id(self, todo_id: uuid4) -> TodoResult | None: ...

    async def list_pending(self, priority: str | None = None) -> list[TodoResult]: ...

    async def fuzzy_match(self, query: str) -> list[TodoResult]:
        """Levenshtein similarity matching"""
        all_pending = await self.list_pending()
        matches = []
        for todo in all_pending:
            score = self._levenshtein_similarity(query.lower(), todo.title.lower())
            if score >= 0.5:
                matches.append((score, todo))
        matches.sort(key=lambda x: x[0], reverse=True)
        return [m[1] for m in matches if m[0] >= 0.5]

    async def complete(self, todo_id: uuid4) -> TodoResult:
        now = datetime.now(timezone.utc)
        stmt = Todo.__table__.update().where(
            Todo.__table__.c.id == todo_id
        ).values(status="completed", completed_at=now)
        await self.conn.execute(stmt)
        return await self.get_by_id(todo_id)

    async def delete(self, todo_id: uuid4) -> None:
        stmt = Todo.__table__.delete().where(Todo.__table__.c.id == todo_id)
        await self.conn.execute(stmt)

    def _levenshtein_similarity(self, a: str, b: str) -> float: ...
```

```python
# app/services/calorie_service.py
@dataclass
class CalorieResult:
    id: str
    food_name: str
    calories: int
    serving_size: str | None
    logged_at: str

@dataclass
class DailySummary:
    total: int
    goal: int
    remaining: int
    percentage: float
    entries: list[CalorieResult]

class CalorieService:
    async def log(self, food_name: str, calories: int,
                  serving_size: str | None = None) -> CalorieResult: ...

    async def get_daily_summary(self, date: date | None = None) -> DailySummary:
        target_date = date or datetime.now(timezone.utc).date()
        # Aggregate query: SELECT SUM(calories), * FROM calorie_logs
        # WHERE logged_at::date = target_date
        ...

    async def get_weekly_summary(self) -> dict:
        # Per-day totals for last 7 days + average + trend
        ...
```

```python
# app/services/stats_service.py
@dataclass
class StatsResult:
    total_xp: int
    current_streak: int
    longest_streak: int
    level: int
    xp_to_next_level: int

class StatsService:
    async def get_stats(self) -> StatsResult: ...

    async def award_xp(self, source: str, source_id: str,
                       base_xp: int, multiplier: float = 1.0,
                       skill_tree: str | None = None) -> int:
        # Insert XPEvent, update UserStats.total_xp
        ...

    async def update_streak(self) -> int:
        # If last_activity_date is yesterday → increment
        # If last_activity_date is today → no change
        # If last_activity_date is older → reset to 1
        ...

    def calculate_level(self, total_xp: int) -> tuple[int, int]:
        # Level = floor(sqrt(total_xp / 100)) + 1
        # XP needed for next = (level * 100) - total_xp
        ...
```

### 2.3 Agent Classes

```python
# app/agent/orchestrator.py
from dataclasses import dataclass, field
from app.agent.context import AgentContext
from app.agent.tools.registry import ToolRegistry
from app.agent.sub_agents.registry import SubAgentRegistry

@dataclass
class AgentResponse:
    text: str
    tool_calls: list[dict] = field(default_factory=list)

class OrchestratorAgent:
    """
    Main agent that receives a user message + context and runs an agentic loop:
    1. LLM decides action (tool call, delegate, or reply)
    2. Executes tool or sub-agent
    3. Evaluates result
    4. Loops until done
    """
    def __init__(self, llm_provider, tools: ToolRegistry,
                 sub_agents: SubAgentRegistry):
        self.llm = llm_provider
        self.tools = tools
        self.sub_agents = sub_agents

    async def run(self, message: str, context: AgentContext) -> AgentResponse:
        system_prompt = self._build_system_prompt(context)
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(context.history)
        messages.append({"role": "user", "content": message})

        max_iterations = 5
        for i in range(max_iterations):
            response = await self.llm.chat(
                messages=messages,
                tools=self.tools.get_schemas(),
                sub_agents=self.sub_agents.get_descriptions()
            )

            if response.type == "tool_call":
                tool_result = await self.tools.execute(response.tool_name, response.tool_args)
                messages.append({"role": "tool", "content": str(tool_result)})

            elif response.type == "delegate":
                sub_result = await self.sub_agents.run(
                    response.sub_agent_name,
                    task=response.task,
                    context=context
                )
                messages.append({"role": "tool", "content": str(sub_result)})

            elif response.type == "final":
                return AgentResponse(text=response.text)

        return AgentResponse(text="I took too long to process that. Please try again.")
```

```python
# app/agent/context.py
from dataclasses import dataclass, field

@dataclass
class AgentContext:
    system_prompt: str
    user_name: str
    goals_summary: str
    campaign_phase: str
    current_streak: int
    total_xp: int
    pending_todos_count: int
    daily_calorie_status: str
    recent_history: list[dict] = field(default_factory=list)
    brain_context: str = ""

class ContextBuilder:
    """Assembles full agent context from database + files"""

    async def build(self, user_message: str, conn) -> AgentContext:
        # 1. Load system prompt from file
        system_prompt = await self._load_system_prompt()

        # 2. Load user stats
        stats = await StatsService(conn).get_stats()

        # 3. Check if message looks like a question → RAG
        brain_context = ""
        if self._looks_like_question(user_message):
            rag_tool = RagTool(conn)
            chunks = await rag_tool.search(user_message, top_k=3)
            brain_context = "\n\n".join(chunks)

        # 4. Load recent conversation history
        history = await self._load_history(conn, limit=20)

        return AgentContext(
            system_prompt=system_prompt,
            user_name="Karpinski94",
            goals_summary="Project Freedom: $17k/mo by Jan 2028",
            campaign_phase="Iteration 1 - MVP",
            current_streak=stats.current_streak,
            total_xp=stats.total_xp,
            pending_todos_count=pending_count,
            daily_calorie_status=calorie_status,
            recent_history=history,
            brain_context=brain_context,
        )
```

### 2.4 Tool Definitions

```python
# app/agent/tools/todo_tools.py
from pydantic import BaseModel, Field
from pydantic_ai import Tool

class CreateTodoInput(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    priority: str = Field("medium", pattern=r"^(low|medium|high)$")
    tags: list[str] = Field(default_factory=list)

class CompleteTodoInput(BaseModel):
    query: str = Field(..., min_length=1, description="Fuzzy match against todo title")

class QueryTodosInput(BaseModel):
    status: str | None = Field(None, pattern=r"^(pending|completed)$")
    priority: str | None = Field(None, pattern=r"^(low|medium|high)$")

# Tool instances for agent registry
create_todo_tool = Tool(
    name="create_todo",
    description="Create a new todo item",
    input_model=CreateTodoInput,
    handler=lambda args, deps: deps.todo_service.create(**args.model_dump())
)
```

### 2.5 Sub-Agent Definitions

```python
# app/agent/sub_agents/calorie_agent.py
from langchain.agents import AgentExecutor
from app.agent.tools.calorie_tools import log_calorie_tool, daily_summary_tool, weekly_summary_tool

class CalorieSubAgent:
    """
    Specialized agent for calorie-related queries.
    Invoked by the orchestrator when it detects:
    - Multi-day analysis ("how has my eating been this week?")
    - Trend questions ("am I eating more than last week?")
    - Advice requests ("what should I change in my diet?")
    """
    def __init__(self, llm, tools):
        self.agent = AgentExecutor(
            agent=...,
            tools=[log_calorie_tool, daily_summary_tool, weekly_summary_tool],
            system_prompt="You are a nutrition tracking specialist..."
        )

    async def run(self, task: str, context) -> str:
        return await self.agent.ainvoke({"input": task})
```

---

## 3. Physical Database Schema

### 3.1 Migration (Alembic)

```sql
-- migration: 001_initial_schema
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),
    tags JSONB DEFAULT '[]',
    status VARCHAR(10) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed')),
    parent_id UUID REFERENCES todos(id),
    xp_value INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_todos_status_priority ON todos(status, priority);
CREATE INDEX idx_todos_parent ON todos(parent_id);

CREATE TABLE calorie_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_name VARCHAR(200) NOT NULL,
    calories INTEGER NOT NULL CHECK (calories > 0),
    serving_size VARCHAR(50),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calorie_logs_date ON calorie_logs((logged_at::date));

CREATE TABLE user_stats (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    daily_calorie_goal INTEGER NOT NULL DEFAULT 2000
);

INSERT INTO user_stats (id) VALUES (1);

CREATE TABLE xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(30) NOT NULL,
    source_id UUID,
    xp_awarded INTEGER NOT NULL,
    multiplier REAL NOT NULL DEFAULT 1.0,
    xp_total_awarded INTEGER NOT NULL,
    skill_tree VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_events_source ON xp_events(source, source_id);

CREATE TABLE brain_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brain_documents_embedding ON brain_documents
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE conversation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'tool_call', 'tool_result')),
    content TEXT NOT NULL,
    tool_name VARCHAR(50),
    tool_input JSONB,
    tool_output JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversation_time ON conversation_logs(created_at);
```

### 3.2 Entity Relationships

```
todos.parent_id ──▶ todos.id          (self-referential, nullable)
xp_events.source_id ──▶ todos.id      (optional FK, nullable)
```

---

## 4. Detailed Logic & Algorithms

### 4.1 Orchestrator Agent Loop (Pseudocode)

```
FUNCTION handle_whatsapp_message(message_text):
    # 1. Acknowledge webhook immediately
    RETURN HTTP 200

    # 2. Build context
    context = BUILD_CONTEXT(message_text)

    # 3. Initialize agent
    agent = OrchestratorAgent(llm, tools, sub_agents)

    # 4. Run agent loop (max 5 iterations)
    response = agent.run(message_text, context)

    # 5. Send reply to WhatsApp
    whatsapp_client.send_message(response.text)

    # 6. Log conversation
    INSERT INTO conversation_logs (role='user', content=message_text)
    INSERT INTO conversation_logs (role='assistant', content=response.text)

    RETURN
```

### 4.2 Streak Calculation

```
FUNCTION update_streak(user_stats):
    today = CURRENT_DATE
    last = user_stats.last_activity_date

    IF last IS NULL:
        user_stats.current_streak = 1
        user_stats.longest_streak = 1
    ELIF last == today - 1:
        user_stats.current_streak += 1
        user_stats.longest_streak = MAX(user_stats.longest_streak, user_stats.current_streak)
    ELIF last == today:
        # Same day activity, no streak change
        RETURN user_stats.current_streak
    ELSE:
        user_stats.current_streak = 1  # Broken streak

    user_stats.last_activity_date = today
    RETURN user_stats.current_streak
```

### 4.3 Streak XP Multiplier

```
FUNCTION get_streak_multiplier(streak):
    IF streak >= 30:  RETURN 2.0
    IF streak >= 14:  RETURN 1.5
    IF streak >= 7:   RETURN 1.25
    RETURN 1.0
```

### 4.4 Level Calculation

```
FUNCTION calculate_level(total_xp):
    # Level curve: each level needs level*100 XP
    # Level 1: 0-99 XP, Level 2: 100-299, Level 3: 300-599, ...
    level = FLOOR(SQRT(total_xp / 100)) + 1
    xp_for_current = (level - 1) ** 2 * 100
    xp_for_next = level ** 2 * 100
    xp_needed = xp_for_next - total_xp
    RETURN (level, xp_needed)
```

### 4.5 Levenshtein Fuzzy Matching

```
FUNCTION levenshtein_similarity(a, b):
    # Returns 0.0 to 1.0
    IF a == b: RETURN 1.0
    IF len(a) == 0 OR len(b) == 0: RETURN 0.0

    distance = LEVENSHTEIN(a, b)  # standard algorithm
    max_len = MAX(len(a), len(b))
    similarity = 1.0 - (distance / max_len)

    # Bonus for substring match
    IF a IN b OR b IN a:
        similarity = MAX(similarity, 0.85)

    RETURN similarity

FUNCTION fuzzy_match_todo(query, todos, threshold=0.5):
    results = []
    FOR todo IN todos:
        score = levenshtein_similarity(query.lower(), todo.title.lower())
        IF score >= threshold:
            results.APPEND((score, todo))

    results.SORT(reverse=True by score)

    IF len(results) == 0:
        RETURN { found: False }
    ELIF len(results) == 1 OR results[0].score > 0.8:
        RETURN { found: True, todo: results[0].todo }
    ELSE:
        RETURN { found: "multiple", candidates: results[0:3] }
```

### 4.6 Brain Document Ingestion

```
FUNCTION ingest_documents(directory, conn):
    FOR file_path IN RECURSIVE_GLOB(directory, "*.md"):
        filename = RELATIVE_PATH(file_path, directory)

        # Read file
        content = READ_FILE(file_path)

        # Skip if already ingested (check by filename)
        IF EXISTS(filename IN brain_documents):
            CONTINUE

        # Split by headings into chunks
        chunks = SPLIT_BY_HEADINGS(content, min_chars=200, max_chars=1000)

        FOR chunk IN chunks:
            # Generate embedding via LLM provider
            embedding = llm_provider.embed(chunk.text)

            # Insert into brain_documents
            INSERT INTO brain_documents (filename, content, embedding)
            VALUES (filename, chunk.text, embedding)

    RETURN count_inserted
```

### 4.7 RAG Retrieval

```
FUNCTION search_brain(query, top_k=5):
    # Generate embedding for query
    query_embedding = llm_provider.embed(query)

    # pgvector cosine similarity search
    results = SELECT filename, content,
        1 - (embedding <=> query_embedding) AS similarity
        FROM brain_documents
        ORDER BY embedding <=> query_embedding
        LIMIT top_k

    RETURN [r.content FOR r IN results WHERE r.similarity > 0.7]
```

---

## 5. Sequence Diagrams (Internal)

### 5.1 WhatsApp → Orchestrator → Tools → Reply

```
whatsapp_webhook    context_builder    orchestrator      todo_tool    llm    whatsapp_client
      │                   │                 │               │          │          │
      │ POST /api/wh      │                 │               │          │          │
      │──────────────────▶│                 │               │          │          │
      │                   │                 │               │          │          │
      │   build_context   │                 │               │          │          │
      │──────────────────▶│                 │               │          │          │
      │◀──────────────────│ context         │               │          │          │
      │                   │                 │               │          │          │
      │   run(message)    │                 │               │          │          │
      │────────────────────────────────────▶│               │          │          │
      │                   │                 │               │          │          │
      │                   │                 │  agent_loop   │          │          │
      │                   │                 │───────────────────────────────────────▶│
      │                   │                 │  "call tool"  │          │          │
      │                   │                 │◀──────────────│          │          │
      │                   │                 │               │          │          │
      │                   │                 │ create_todo   │          │          │
      │                   │                 │──────────────▶│          │          │
      │                   │                 │◀──────────────│ result   │          │
      │                   │                 │               │          │          │
      │                   │                 │  eval: done?  │          │          │
      │                   │                 │───────────────────────────────────────▶│
      │                   │                 │ "final reply" │          │          │
      │                   │                 │◀──────────────│          │          │
      │                   │                 │               │          │          │
      │  response.text    │                 │               │          │          │
      │◀────────────────────────────────────│               │          │          │
      │                   │                 │               │          │          │
      │ send_message      │                 │               │          │          │
      │───────────────────────────────────────────────────────────────────────────▶│
```

### 5.2 Sub-Agent Delegation

```
orchestrator    sub_agent_registry    calorie_sub_agent    calorie_tools    llm
      │                 │                     │                 │            │
      │ "delegate"      │                     │                 │            │
      │────────────────▶│                     │                 │            │
      │                 │ "how's my week?"    │                 │            │
      │                 │────────────────────▶│                 │            │
      │                 │                     │                 │            │
      │                 │                     │ sub_agent_loop  │            │
      │                 │                     │──────────────────────────────────────────▶│
      │                 │                     │ "get daily totals" │            │
      │                 │                     │───────────────────▶│            │
      │                 │                     │◀───────────────────│ result     │
      │                 │                     │                    │            │
      │                 │                     │ "calculate avg"    │            │
      │                 │                     │──────────────────────────────────────────▶│
      │                 │                     │ "final analysis"   │            │
      │                 │                     │◀───────────────────│            │
      │                 │                     │                    │            │
      │                 │ "Your weekly avg..."│                    │            │
      │                 │◀────────────────────│                    │            │
      │◀────────────────│                     │                    │            │
```

---

## 6. API Interface Definitions

### 6.1 REST API Routes

```python
# app/api/router.py
api_router = APIRouter()

# ─── Todos ───
@api_router.get("/todos", response_model=list[TodoResponse])
async def list_todos(status: str | None = None, priority: str | None = None): ...

@api_router.post("/todos", response_model=TodoResponse, status_code=201)
async def create_todo(body: CreateTodoRequest): ...

@api_router.get("/todos/{todo_id}", response_model=TodoResponse)
async def get_todo(todo_id: UUID): ...

@api_router.put("/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: UUID, body: UpdateTodoRequest): ...

@api_router.delete("/todos/{todo_id}", status_code=204)
async def delete_todo(todo_id: UUID): ...

@api_router.patch("/todos/{todo_id}/complete", response_model=TodoCompleteResponse)
async def complete_todo(todo_id: UUID): ...

# ─── Calories ───
@api_router.post("/calories", response_model=CalorieResponse, status_code=201)
async def log_calorie(body: CreateCalorieRequest): ...

@api_router.get("/calories", response_model=list[CalorieResponse])
async def list_calories(date: date | None = None): ...

@api_router.delete("/calories/{calorie_id}", status_code=204)
async def delete_calorie(calorie_id: UUID): ...

@api_router.get("/calories/daily", response_model=DailyCalorieResponse)
async def daily_calorie_summary(): ...

@api_router.get("/calories/weekly", response_model=WeeklyCalorieResponse)
async def weekly_calorie_summary(): ...

# ─── Stats ───
@api_router.get("/stats", response_model=StatsResponse)
async def get_stats(): ...

# ─── Quests ───
@api_router.get("/quests", response_model=list[QuestResponse])
async def list_quests(): ...

# ─── Brain ───
@api_router.get("/brain/ask", response_model=BrainAnswerResponse)
async def ask_brain(q: str): ...
```

### 6.2 Request/Response Schemas

```python
# app/schemas/todo.py
from pydantic import BaseModel, Field

class CreateTodoRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    priority: str = Field("medium", pattern=r"^(low|medium|high)$")
    tags: list[str] = []

class UpdateTodoRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=2000)
    priority: str | None = Field(None, pattern=r"^(low|medium|high)$")
    tags: list[str] | None = None

class TodoResponse(BaseModel):
    id: str
    title: str
    description: str | None
    priority: str
    tags: list[str]
    status: str
    parent_id: str | None
    xp_value: int
    created_at: str
    completed_at: str | None

class TodoCompleteResponse(BaseModel):
    todo: TodoResponse
    xp_earned: int
    streak: int
    total_xp: int
```

```python
# app/schemas/calorie.py
class CreateCalorieRequest(BaseModel):
    food_name: str = Field(..., min_length=1, max_length=200)
    calories: int = Field(..., gt=0, lt=10000)
    serving_size: str | None = Field(None, max_length=50)

class CalorieResponse(BaseModel):
    id: str
    food_name: str
    calories: int
    serving_size: str | None
    logged_at: str

class DailyCalorieResponse(BaseModel):
    date: str
    total: int
    goal: int
    remaining: int
    percentage: float
    entries: list[CalorieResponse]

class WeeklyCalorieResponse(BaseModel):
    daily_totals: list[dict]  # [{ date, total }]
    average: float
    trend: str  # up | down | stable
```

```python
# app/schemas/stats.py
class StatsResponse(BaseModel):
    total_xp: int
    current_streak: int
    longest_streak: int
    level: int
    xp_to_next_level: int
```

### 6.3 WhatsApp Webhook

```python
# app/whatsapp/webhook.py
from fastapi import APIRouter, Request, Response

whatsapp_router = APIRouter()

@whatsapp_router.get("/whatsapp")
async def verify_webhook(hub_mode: str, hub_challenge: str, hub_verify_token: str):
    """WhatsApp Cloud API webhook verification"""
    if hub_mode == "subscribe" and hub_verify_token == settings.whatsapp_app_secret:
        return Response(content=hub_challenge, media_type="text/plain")
    return Response(status_code=403)

@whatsapp_router.post("/whatsapp")
async def receive_message(request: Request):
    """Incoming WhatsApp message"""
    # Verify signature
    signature = request.headers.get("X-Hub-Signature-256", "")
    body = await request.body()
    if not verify_whatsapp_signature(body, signature):
        return Response(status_code=401)

    # Acknowledge immediately
    # Process asynchronously (or sync for MVP)
    payload = await request.json()
    message_text = extract_text(payload)

    # Run orchestrator agent
    response = await run_agent(message_text)

    # Send reply via WhatsApp API
    await send_whatsapp_message(settings.whatsapp_phone_number_id, response.text)

    return Response(status_code=200)
```

---

## 7. State Management

### 7.1 Frontend State (SWR)

```typescript
// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchTodos(filters?: { status?: string; priority?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  const res = await fetch(`${API_URL}/todos?${params}`);
  return res.json() as Promise<Todo[]>;
}

export async function createTodo(data: CreateTodoInput) {
  const res = await fetch(`${API_URL}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json() as Promise<Todo>;
}

export async function completeTodo(id: string) {
  const res = await fetch(`${API_URL}/todos/${id}/complete`, { method: "PATCH" });
  return res.json() as Promise<TodoCompleteResponse>;
}

export async function deleteTodo(id: string) {
  await fetch(`${API_URL}/todos/${id}`, { method: "DELETE" });
}
```

```typescript
// frontend/app/todos/page.tsx (component example)
"use client";
import useSWR from "swr";
import { fetchTodos, completeTodo, deleteTodo } from "@/lib/api";

export default function TodosPage() {
  const { data: todos, mutate } = useSWR("/todos", () => fetchTodos({ status: "pending" }));

  const handleComplete = async (id: string) => {
    await completeTodo(id);
    mutate(); // revalidate
  };

  return (
    <div>
      <h1>Todos</h1>
      {todos?.map(todo => (
        <div key={todo.id}>
          <span>{todo.title}</span>
          <button onClick={() => handleComplete(todo.id)}>✓</button>
        </div>
      ))}
    </div>
  );
}
```

### 7.2 Mutation Strategy

```typescript
// Optimistic updates for instant UI feedback
const { trigger } = useSWRMutation("/todos", (url, { arg }: { arg: CreateTodoInput }) =>
  createTodo(arg)
);

const handleCreate = async (data: CreateTodoInput) => {
  // Optimistically add to local state
  await trigger(data, {
    optimisticData: [...(todos || []), { id: "temp", ...data, status: "pending" }],
    rollbackOnError: true,
  });
};
```

### 7.3 Page Routes & Data Requirements

| Route | Data | SWR Key | Revalidate |
|-------|------|---------|------------|
| `/` (Dashboard) | Stats + recent activity | `/stats` | On mount + 30s poll |
| `/todos` | Pending + completed todos | `/todos` | On mutate (CRUD actions) |
| `/calories` | Today's entries + weekly chart | `/calories/daily`, `/calories/weekly` | On mutate + 30s poll |
| `/quests` | Active quests with progress | `/quests` | On mount |

---

## 8. Unit Testing Strategy

### 8.1 Backend Test Structure

```
backend/tests/
├── conftest.py              # Fixtures: test DB, LLM mock, agent mock
├── test_todo_service.py     # Business logic: CRUD, fuzzy match
├── test_calorie_service.py  # Daily/weekly aggregation
├── test_stats_service.py    # XP, streaks, level calc
├── test_agent.py
│   ├── test_orchestrator.py # Agent loop with mock LLM
│   ├── test_context.py      # Context builder assembly
│   └── test_tools.py        # Tool execution
├── test_whatsapp.py         # Webhook verify, signature check
├── test_api.py
│   ├── test_todos_api.py    # REST endpoint integration
│   ├── test_calories_api.py
│   └── test_stats_api.py
└─┬ test_rag.py              # Embedding + retrieval
```

### 8.2 Mock Strategy

```python
# tests/conftest.py
import pytest
from unittest.mock import AsyncMock

@pytest.fixture
def mock_llm():
    """Mock LLM that returns predefined responses"""
    llm = AsyncMock()
    llm.chat.return_value = AgentResponse(
        type="final",
        text="Mock response"
    )
    return llm

@pytest.fixture
def mock_ollama():
    """Mock Ollama for local testing"""
    ...

@pytest.fixture
async def test_db():
    """In-memory PostgreSQL or SQLite for tests"""
    ...
```

### 8.3 Test Cases

```python
# tests/test_stats_service.py
@pytest.mark.asyncio
async def test_streak_increment_consecutive_day():
    """Given last activity yesterday, streak should increment by 1"""
    stats = UserStats(last_activity_date=date.today() - timedelta(days=1), current_streak=5)
    new_streak = await update_streak(stats)
    assert new_streak == 6
    assert stats.longest_streak == 6

@pytest.mark.asyncio
async def test_streak_reset_on_gap():
    """Given last activity 3 days ago, streak should reset to 1"""
    stats = UserStats(last_activity_date=date.today() - timedelta(days=3), current_streak=10)
    new_streak = await update_streak(stats)
    assert new_streak == 1

@pytest.mark.asyncio
async def test_xp_award_with_streak_multiplier():
    """30+ day streak should double XP"""
    base_xp = 10
    streak = 35
    multiplier = get_streak_multiplier(streak)
    assert multiplier == 2.0
    total = base_xp * multiplier
    assert total == 20

# tests/test_todo_service.py
@pytest.mark.asyncio
async def test_fuzzy_match_exact():
    """Exact match should return score 1.0"""
    service = TodoService(mock_conn)
    score = service._levenshtein_similarity("edit video", "edit video")
    assert score == 1.0

@pytest.mark.asyncio
async def test_fuzzy_match_typo():
    """Close match should return high score"""
    service = TodoService(mock_conn)
    score = service._levenshtein_similarity("edit vdeo", "edit video")
    assert score > 0.8

@pytest.mark.asyncio
async def test_fuzzy_match_no_match():
    """Unrelated query should return low score"""
    service = TodoService(mock_conn)
    score = service._levenshtein_similarity("buy groceries", "edit video")
    assert score < 0.3
```

### 8.4 Coverage Targets

| Module | Coverage Target |
|--------|----------------|
| `services/` | ≥ 90% |
| `agent/tools/` | ≥ 85% |
| `agent/orchestrator.py` | ≥ 80% |
| `whatsapp/` | ≥ 85% |
| `api/` | ≥ 85% |
| `llm/provider.py` | ≥ 70% (abstract, hard to unit test) |

---

**Next Step:** RTM — Requirements Traceability Matrix

*Draft for approval.*
