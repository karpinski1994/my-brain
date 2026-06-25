"use client"

import { useState, useEffect, useCallback } from "react"
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

interface TaskEditModalProps {
  todo: Todo
  subtodos?: Todo[]
  onClose: () => void
  onSave: (updated: Todo) => void
  onDelete: (id: string) => void
  onToggleSubtask: (id: string) => void
  onEditSubtask?: (id: string) => void
  onDeleteSubtask?: (id: string) => void
  onAddSubtask?: (title: string) => void
}

export default function TaskEditModal({
  todo,
  subtodos,
  onClose,
  onSave,
  onDelete,
  onToggleSubtask,
  onEditSubtask,
  onDeleteSubtask,
  onAddSubtask,
}: TaskEditModalProps) {
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description)
  const [priority, setPriority] = useState(todo.priority)
  const [area, setArea] = useState(todo.area)
  const [tagsInput, setTagsInput] = useState((todo.tags || []).join(", "))
  const [dirty, setDirty] = useState(false)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const markDirty = useCallback(() => setDirty(true), [])

  const xpValue =
    priority === "high" ? 20 : priority === "medium" ? 10 : 5

  function handleSave() {
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    onSave({
      ...todo,
      title,
      description,
      priority,
      area,
      tags,
      xp_value: xpValue,
    })
    setDirty(false)
  }

  function handleDelete() {
    if (confirm(`Delete "${todo.title}"?`)) {
      onDelete(todo.id)
      onClose()
    }
  }

  const xpMap: Record<string, number> = { high: 20, medium: 10, low: 5 }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">Edit Task</h3>
          <button onClick={onClose} className="text-lg" style={{ color: "var(--text-dim)" }}>
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-dim)" }}>
              Title
            </label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty() }}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-dim)" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); markDirty() }}
              rows={3}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm resize-none"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-dim)" }}>
              Priority
            </label>
            <div className="flex gap-2">
              {(["high", "medium", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPriority(p); markDirty() }}
                  className="px-3 py-1.5 rounded text-xs font-medium"
                  style={{
                    background: priority === p ? priorityColor[p] : "var(--bg)",
                    color: priority === p ? "#fff" : "var(--text-dim)",
                    border: priority === p ? "none" : "1px solid var(--border)",
                  }}
                >
                  {priorityLabel[p]} ({xpMap[p]} XP)
                </button>
              ))}
            </div>
          </div>

          {/* Tags + Area */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-dim)" }}>
                Tags (comma-separated)
              </label>
              <input
                value={tagsInput}
                onChange={(e) => { setTagsInput(e.target.value); markDirty() }}
                className="w-full px-3 py-2 rounded-lg outline-none text-xs"
                style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-dim)" }}>
                Area
              </label>
              <input
                value={area}
                onChange={(e) => { setArea(e.target.value); markDirty() }}
                className="w-full px-3 py-2 rounded-lg outline-none text-xs"
                style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>
          </div>

          {/* Subtasks */}
          {(subtodos && subtodos.length > 0) || onAddSubtask ? (
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-dim)" }}>
                Subtasks {subtodos ? `(${subtodos.filter((s) => s.status === "completed").length}/${subtodos.length})` : ""}
              </label>

              {subtodos && subtodos.length > 0 && (
                <div className="space-y-1 mb-2">
                  {subtodos.map((s) => {
                    const done = s.status === "completed"
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                        style={{ background: "var(--bg)", opacity: done ? 0.5 : 1 }}
                      >
                        <button
                          onClick={() => onToggleSubtask(s.id)}
                          className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor: done ? "var(--green)" : "var(--border)",
                            background: done ? "var(--green)" : "transparent",
                          }}
                        >
                          {done && <span className="text-[7px]" style={{ color: "#fff" }}>✓</span>}
                        </button>

                        <span
                          className="flex-1 truncate cursor-pointer hover:opacity-70"
                          style={{ textDecoration: done ? "line-through" : "none" }}
                          onClick={() => onEditSubtask?.(s.id)}
                          title="Edit subtask"
                        >
                          {s.title}
                        </span>

                        <span style={{ color: "var(--text-dim)" }}>+{s.xp_value} XP</span>

                        {onDeleteSubtask && (
                          <button
                            onClick={() => onDeleteSubtask(s.id)}
                            className="text-xs px-1 py-0.5 rounded hover:opacity-60"
                            style={{ color: "var(--red)" }}
                            title="Delete subtask"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {onAddSubtask && (
                <div className="flex gap-2">
                  <input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSubtaskTitle.trim()) {
                        onAddSubtask(newSubtaskTitle.trim())
                        setNewSubtaskTitle("")
                      }
                    }}
                    placeholder="Add a subtask…"
                    className="flex-1 px-3 py-1.5 rounded-lg outline-none text-xs"
                    style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                  />
                  <button
                    onClick={() => {
                      if (newSubtaskTitle.trim()) {
                        onAddSubtask(newSubtaskTitle.trim())
                        setNewSubtaskTitle("")
                      }
                    }}
                    className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    + Add
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded text-xs font-medium"
              style={{ background: "var(--bg)", color: "var(--red)", border: "1px solid var(--red)" }}
            >
              Delete
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded text-xs font-medium"
                style={{ background: "var(--bg)", color: "var(--text-dim)", border: "1px solid var(--border)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty}
                className="px-4 py-1.5 rounded text-xs font-medium transition disabled:opacity-40"
                style={{ background: dirty ? "var(--accent)" : "var(--bg)", color: dirty ? "#fff" : "var(--text-dim)" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
