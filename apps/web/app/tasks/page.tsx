"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Todo } from "@/lib/types"
import FilterBar from "@/components/FilterBar"
import TaskEditModal from "@/components/TaskEditModal"

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
  const [editingId, setEditingId] = useState<string | null>(null)

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

  const childrenMap = useMemo(() => {
    const map = new Map<string, Todo[]>()
    for (const t of todos) {
      if (t.parent_id) {
        const arr = map.get(t.parent_id) || []
        arr.push(t)
        map.set(t.parent_id, arr)
      }
    }
    return map
  }, [todos])

  const parentIds = useMemo(() => new Set(childrenMap.keys()), [childrenMap])

  const pending = filtered.filter((t) => t.status === "pending")
  const completed = filtered.filter((t) => t.status === "completed")

  const standalone = pending.filter((t) => !t.parent_id && !parentIds.has(t.id))
  const parents = pending.filter((t) => parentIds.has(t.id))

  const high = standalone.filter((t) => t.priority === "high")
  const medium = standalone.filter((t) => t.priority === "medium")
  const low = standalone.filter((t) => t.priority === "low")

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

  const editingTodo = useMemo(() => editingId ? todos.find(t => t.id === editingId) ?? null : null, [editingId, todos])
  const editingSubtodos = useMemo(() => editingId ? todos.filter(t => t.parent_id === editingId) : undefined, [editingId, todos])

  async function handleEditSave(updated: Todo) {
    const { _id, ...body } = updated as any
    delete body._id
    await fetch(`/api/todos/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setEditingId(null)
  }

  function handleToggleSubtaskInModal(id: string) {
    const t = todos.find(t => t.id === id)
    if (!t) return
    if (t.status === "completed") {
      revertTask(id)
    } else {
      completeTask(id)
    }
  }

  async function handleAddSubtask(title: string) {
    if (!editingId) return
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority: editingTodo?.priority || "medium", parent_id: editingId }),
    })
    const subtask = await res.json()
    setTodos((prev) => [...prev, subtask])
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
              <span>{filtered.filter((t) => t.status === "completed").length} of {filtered.length} done</span>
              <span>{Math.round((filtered.filter((t) => t.status === "completed").length / filtered.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${filtered.length > 0 ? (filtered.filter((t) => t.status === "completed").length / filtered.length) * 100 : 0}%`,
                  background: filtered.length > 0 && filtered.every((t) => t.status === "completed") ? "var(--green)" : "var(--accent)",
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

          {(high.length > 0 || parents.some(p => p.priority === "high")) && (
            <Section label="High Priority" color={priorityColor.high} tasks={high} parents={parents.filter(t => t.priority === "high")} childrenMap={childrenMap} onComplete={completeTask} onDelete={deleteTask} onRevert={revertTask} onEdit={setEditingId} />
          )}
          {(medium.length > 0 || parents.some(p => p.priority === "medium")) && (
            <Section label="Medium Priority" color={priorityColor.medium} tasks={medium} parents={parents.filter(t => t.priority === "medium")} childrenMap={childrenMap} onComplete={completeTask} onDelete={deleteTask} onRevert={revertTask} onEdit={setEditingId} />
          )}
          {(low.length > 0 || parents.some(p => p.priority === "low")) && (
            <Section label="Low Priority" color={priorityColor.low} tasks={low} parents={parents.filter(t => t.priority === "low")} childrenMap={childrenMap} onComplete={completeTask} onDelete={deleteTask} onRevert={revertTask} onEdit={setEditingId} />
          )}

          {filtered.length === 0 && todos.length > 0 && (
            <div className="text-center py-12" style={{ color: "var(--text-dim)" }}>
              <p className="text-sm">No tasks match your filters</p>
            </div>
          )}
        </>
      )}

      {editingTodo && (
        <TaskEditModal
          todo={editingTodo}
          subtodos={editingSubtodos}
          onClose={() => setEditingId(null)}
          onSave={handleEditSave}
          onDelete={deleteTask}
          onToggleSubtask={handleToggleSubtaskInModal}
          onEditSubtask={setEditingId}
          onDeleteSubtask={deleteTask}
          onAddSubtask={handleAddSubtask}
        />
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
  parents,
  childrenMap,
  onComplete,
  onDelete,
  onRevert,
  onEdit,
}: {
  label: string
  color: string
  tasks: Todo[]
  parents: Todo[]
  childrenMap: Map<string, Todo[]>
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onRevert: (id: string) => void
  onEdit: (id: string) => void
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color }}>
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
        {label} ({tasks.length + parents.length})
      </h3>
      <div className="space-y-3">
        {parents.map((parent) => {
          const children = childrenMap.get(parent.id) || []
          const done = children.filter((c) => c.status === "completed").length
          const pct = children.length > 0 ? Math.round((done / children.length) * 100) : 0
          return (
            <div
              key={parent.id}
              className="rounded-xl p-4 transition"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(parent.id)}>
                  <p className="text-sm font-semibold">{parent.title}</p>
                  {parent.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-dim)" }}>
                      {parent.description}
                    </p>
                  )}
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded cursor-pointer" onClick={() => onEdit(parent.id)} style={{ background: "var(--bg)", color: "var(--text-dim)" }}>
                  +{parent.xp_value} XP
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: done === children.length ? "var(--green)" : color }}
                  />
                </div>
                <span className="text-xs font-mono" style={{ color: "var(--text-dim)" }}>
                  {done}/{children.length}
                </span>
              </div>

              <div className="space-y-1.5 ml-2 pl-3 border-l-2" style={{ borderColor: "var(--border)" }}>
                {children.map((c) => {
                  const childDone = c.status === "completed"
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition cursor-pointer"
                      style={{ opacity: childDone ? 0.4 : 1 }}
                    >
                      <button
                        onClick={() => childDone ? onRevert(c.id) : onComplete(c.id)}
                        className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition hover:opacity-80"
                        style={{
                          borderColor: childDone ? "var(--green)" : color,
                          background: childDone ? "var(--green)" : "transparent",
                        }}
                      >
                        {childDone && <span className="text-[8px]" style={{ color: "#fff" }}>✓</span>}
                      </button>
                      <p className="text-xs truncate flex-1" style={{ textDecoration: childDone ? "line-through" : "none" }}>
                        {c.title}
                      </p>
                      <span className="text-xs font-mono" style={{ color: childDone ? "var(--green)" : "var(--text-dim)" }}>
                        +{c.xp_value} XP
                      </span>
                      <button
                        onClick={() => onDelete(c.id)}
                        className="text-xs px-1 py-0.5 rounded opacity-0 hover:opacity-100"
                        style={{ color: "var(--red)" }}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

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
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(t.id)}>
              <p className="text-sm font-medium truncate">{t.title}</p>
              {t.description && (
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-dim)" }}>
                  {t.description}
                </p>
              )}
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded cursor-pointer" onClick={() => onEdit(t.id)} style={{ background: "var(--bg)", color: "var(--text-dim)" }}>
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
