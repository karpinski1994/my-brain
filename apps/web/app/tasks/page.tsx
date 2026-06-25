"use client"

import { useState, useEffect } from "react"
import type { Todo } from "@/lib/types"

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
  const [completed, setCompleted] = useState<Todo[]>([])

  useEffect(() => {
    fetch("/api/todos").then((r) => r.json()).then(setTodos)
    fetch("/api/todos/completed").then((r) => r.json()).then(setCompleted).catch(() => {})
  }, [])

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

  async function completeTask(id: string) {
    await fetch(`/api/todos/${id}/complete`, { method: "PATCH" })
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  async function deleteTask(id: string) {
    await fetch(`/api/todos/${id}`, { method: "DELETE" })
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const high = todos.filter((t) => t.priority === "high")
  const medium = todos.filter((t) => t.priority === "medium")
  const low = todos.filter((t) => t.priority === "low")

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
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
        <div className="mb-6 p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
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

      {!high.length && !medium.length && !low.length ? (
        <div className="text-center py-16" style={{ color: "var(--text-dim)" }}>
          <p className="text-4xl mb-3">📋</p>
          <p>No pending tasks. Add one above!</p>
        </div>
      ) : (
        <>
          <Section label="High Priority" color={priorityColor.high} tasks={high} onComplete={completeTask} onDelete={deleteTask} />
          <Section label="Medium Priority" color={priorityColor.medium} tasks={medium} onComplete={completeTask} onDelete={deleteTask} />
          <Section label="Low Priority" color={priorityColor.low} tasks={low} onComplete={completeTask} onDelete={deleteTask} />
        </>
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
  if (!tasks.length) return null
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
