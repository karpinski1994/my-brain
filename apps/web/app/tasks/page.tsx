"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Todo } from "@/lib/types"
import FilterBar from "@/components/FilterBar"

const priorityColor: Record<string, string> = {
  high: "var(--red)",
  medium: "var(--gold)",
  low: "var(--blue)",
}

const priorityLabel: Record<string, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
}

export default function TasksPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState("")
  const [newPriority, setNewPriority] = useState<string>("medium")
  const [showForm, setShowForm] = useState(false)
  const [undo, setUndo] = useState<{ todo: Todo; from: "pending" | "completed" } | null>(null)

  const [search, setSearch] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>(() => ({
    priority: new Set(["high"]),
    tag: new Set<string>(),
  }))
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    fetch("/api/todos").then((r) => r.json()).then(setTodos)
  }, [])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const t of todos) {
      for (const tag of (t.tags || [])) tags.add(tag)
    }
    return Array.from(tags).sort()
  }, [todos])

  const filtered = useMemo(() => {
    let result = todos

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
      )
    }

    const selectedPriorities = selectedFilters.priority
    if (selectedPriorities && selectedPriorities.size < 3) {
      result = result.filter((t) => selectedPriorities.has(t.priority))
    }

    const selectedTags = selectedFilters.tag
    if (selectedTags && selectedTags.size > 0) {
      result = result.filter((t) => (t.tags || []).some((tag) => selectedTags.has(tag)))
    }

    if (!showCompleted) {
      result = result.filter((t) => t.status === "pending")
    }

    return result
  }, [todos, search, selectedFilters, showCompleted])

  const pending = filtered.filter((t) => t.status === "pending")
  const completed = filtered.filter((t) => t.status === "completed")

  const high = pending.filter((t) => t.priority === "high")
  const medium = pending.filter((t) => t.priority === "medium")
  const low = pending.filter((t) => t.priority === "low")

  async function addTodo() {
    if (!newTitle.trim()) return
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim(), priority: newPriority }),
    })
    const todo = await res.json()
    setTodos((prev) => [...prev, todo])
    setNewTitle("")
    setNewPriority("medium")
    setShowForm(false)
  }

  const completeTask = useCallback(async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    setUndo(null)
    await fetch(`/api/todos/${id}/complete`, { method: "PATCH" })
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status: "completed", completed: new Date().toISOString() } : t)))
    setUndo({ todo: { ...todo, status: "completed" }, from: "pending" })
    setTimeout(() => setUndo((u) => (u?.todo.id === id ? null : u)), 5000)
  }, [todos])

  const undoComplete = useCallback(async () => {
    if (!undo) return
    await fetch(`/api/todos/${undo.todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending", completed: null }),
    })
    setTodos((prev) => prev.map((t) => (t.id === undo.todo.id ? { ...t, status: "pending", completed: null } : t)))
    setUndo(null)
  }, [undo])

  async function revertTask(id: string) {
    await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending", completed: null }),
    })
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, status: "pending", completed: null } : t)))
    setUndo((u) => (u?.todo.id === id ? null : u))
  }

  async function deleteTask(id: string) {
    await fetch(`/api/todos/${id}`, { method: "DELETE" })
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const filterConfigs = [
    {
      label: "Priority",
      key: "priority",
      options: [
        { label: "High", value: "high", color: priorityColor.high },
        { label: "Medium", value: "medium", color: priorityColor.medium },
        { label: "Low", value: "low", color: priorityColor.low },
      ],
    },
    {
      label: "Tag",
      key: "tag",
      options: allTags.map((tag) => ({ label: tag, value: tag })),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          + Add Task
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <input
            autoFocus
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            className="w-full px-3 py-2 rounded-lg mb-3 outline-none text-sm"
            style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
          <div className="flex gap-2 items-center">
            {["low", "medium", "high"].map((p) => (
              <button
                key={p}
                onClick={() => setNewPriority(p)}
                className="px-3 py-1.5 rounded text-xs font-medium transition"
                style={{
                  background: newPriority === p ? priorityColor[p] : "var(--bg)",
                  color: newPriority === p ? "#fff" : "var(--text-dim)",
                  border: newPriority === p ? "none" : "1px solid var(--border)",
                }}
              >
                {priorityLabel[p]}
              </button>
            ))}
            <button
              onClick={addTodo}
              className="ml-auto px-4 py-1.5 rounded text-xs font-medium"
              style={{ background: "var(--green)", color: "#fff" }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {!todos.length ? (
        <div className="text-center py-16" style={{ color: "var(--text-dim)" }}>
          <p className="text-4xl mb-3">📋</p>
          <p>No tasks yet. Add one above!</p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--text-dim)" }}>
              <span>{todos.filter((t) => t.status === "completed").length} of {todos.length} done</span>
              <span>{Math.round((todos.filter((t) => t.status === "completed").length / todos.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(todos.filter((t) => t.status === "completed").length / todos.length) * 100}%`,
                  background: todos.every((t) => t.status === "completed") ? "var(--green)" : "var(--accent)",
                }}
              />
            </div>
          </div>

          <FilterBar
            searchPlaceholder="Search tasks..."
            filterConfigs={filterConfigs}
            showCompleted={showCompleted}
            onShowCompletedChange={setShowCompleted}
            selected={selectedFilters}
            onSelectedChange={(key, values) => setSelectedFilters((prev) => ({ ...prev, [key]: values }))}
            search={search}
            onSearchChange={setSearch}
          />

          {completed.length > 0 && showCompleted && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--green)" }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--green)" }} />
                Completed ({completed.length})
              </h3>
              <div className="space-y-1.5">
                {completed.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => revertTask(t.id)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer hover:opacity-60"
                    style={{ opacity: 0.35 }}
                    title="Click to undo"
                  >
                    <span className="text-xs" style={{ color: "var(--green)" }}>✓</span>
                    <p className="text-xs truncate" style={{ textDecoration: "line-through", color: "var(--text-dim)" }}>
                      {t.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {high.length > 0 && <Section label="High Priority" color={priorityColor.high} tasks={high} onComplete={completeTask} onDelete={deleteTask} />}
          {medium.length > 0 && <Section label="Medium Priority" color={priorityColor.medium} tasks={medium} onComplete={completeTask} onDelete={deleteTask} />}
          {low.length > 0 && <Section label="Low Priority" color={priorityColor.low} tasks={low} onComplete={completeTask} onDelete={deleteTask} />}

          {filtered.length === 0 && todos.length > 0 && (
            <div className="text-center py-12" style={{ color: "var(--text-dim)" }}>
              <p className="text-sm">No tasks match your filters</p>
            </div>
          )}
        </>
      )}

      {undo && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg z-50"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
            ✓ {undo.todo.title.slice(0, 40)}
          </span>
          <button
            onClick={undoComplete}
            className="px-3 py-1 rounded text-xs font-medium transition"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}

function Section({
  label,
  color,
  tasks,
  onComplete,
  onDelete,
}: {
  label: string
  color: string
  tasks: Todo[]
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color }}>
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
        {label} ({tasks.length})
      </h3>
      <div className="space-y-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 p-3 rounded-xl transition"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => onComplete(t.id)}
              className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition hover:opacity-80"
              style={{ borderColor: color }}
            >
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.title}</p>
              {t.description && (
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-dim)" }}>
                  {t.description}
                </p>
              )}
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--text-dim)" }}>
              +{t.xp_value} XP
            </span>
            <button
              onClick={() => onDelete(t.id)}
              className="text-xs px-2 py-1 rounded transition opacity-0 hover:opacity-100"
              style={{ color: "var(--red)" }}
              title="Delete"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
