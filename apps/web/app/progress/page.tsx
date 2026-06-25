"use client"

import { useState, useEffect } from "react"
import type { ProgressItem } from "@/lib/types"

export default function ProgressPage() {
  const [items, setItems] = useState<ProgressItem[]>([])
  const [stats, setStats] = useState<{
    total_xp: number
    current_streak: number
    longest_streak: number
    level: number
    xp_to_next: number
    xp_for_next: number
  } | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newUnit, setNewUnit] = useState("")
  const [newTotal, setNewTotal] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({})
  const [logNotes, setLogNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/progress").then((r) => r.json()).then(setItems)
    fetch("/api/stats").then((r) => r.json()).then(setStats)
  }, [])

  async function addItem() {
    if (!newTitle.trim()) return
    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        category: newCategory.trim() || "other",
        unit: newUnit.trim() || "units",
        total: Number(newTotal) || 1,
      }),
    })
    const item = await res.json()
    setItems((prev) => [...prev, item])
    setNewTitle("")
    setNewCategory("")
    setNewUnit("")
    setNewTotal("")
    setShowForm(false)
  }

  async function deleteItem(id: string) {
    await fetch(`/api/progress/${id}`, { method: "DELETE" })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function logProgress(id: string) {
    const amount = sliderValues[id] || 0
    if (amount === 0) return
    const res = await fetch(`/api/progress/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, note: logNotes[id] || "" }),
    })
    const updated = await res.json()
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
    setSliderValues((prev) => ({ ...prev, [id]: 0 }))
    setLogNotes((prev) => ({ ...prev, [id]: "" }))
  }

  const xpPct = stats ? Math.round(((stats.xp_for_next - stats.xp_to_next) / stats.xp_for_next) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Progression</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          + Add
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="Level" value={String(stats.level)} color="var(--accent)" />
          <StatCard label="Total XP" value={String(stats.total_xp)} color="var(--gold)" />
          <StatCard label="Streak" value={`${stats.current_streak}d`} color="var(--green)" />
          <StatCard label="Best" value={`${stats.longest_streak}d`} color="var(--blue)" />
        </div>
      )}

      {stats && (
        <div className="mb-6 p-3 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-dim)" }}>
            <span>Level {stats.level} → {stats.level + 1}</span>
            <span>{stats.xp_to_next} XP remaining</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${xpPct}%`, background: "var(--accent)" }} />
          </div>
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <input
            autoFocus
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="w-full px-3 py-2 rounded-lg mb-3 outline-none text-sm"
            style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
          <div className="grid grid-cols-3 gap-3 mb-3">
            <input
              placeholder="Category (e.g. course)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-3 py-2 rounded-lg outline-none text-xs"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <input
              placeholder="Unit (e.g. lectures)"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="px-3 py-2 rounded-lg outline-none text-xs"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            <input
              type="number"
              min="1"
              placeholder="Total"
              value={newTotal}
              onChange={(e) => setNewTotal(e.target.value)}
              className="px-3 py-2 rounded-lg outline-none text-xs"
              style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
            </div>
          <button
            onClick={addItem}
            className="px-4 py-1.5 rounded text-xs font-medium"
            style={{ background: "var(--green)", color: "#fff" }}
          >
            Create
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-dim)" }}>
          <p className="text-4xl mb-3">📈</p>
          <p>No progress items yet. Add your first book or course!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const pct = item.total > 0 ? Math.round((item.current / item.total) * 100) : 0
            const done = item.status === "completed"
            return (
              <div
                key={item.id}
                className="rounded-xl p-4 transition"
                style={{ background: "var(--card)", border: "1px solid var(--border)", opacity: done ? 0.55 : 1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{done ? "✅" : "🔄"}</span>
                    <span className="text-sm font-semibold truncate">{item.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--text-dim)" }}>
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono" style={{ color: done ? "var(--green)" : "var(--gold)" }}>
                      {item.current}/{item.total} {item.unit}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-xs px-1.5 py-0.5 rounded opacity-0 hover:opacity-100"
                      style={{ color: "var(--red)" }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full overflow-hidden mb-3" style={{ background: "var(--bg)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: done ? "var(--green)" : "var(--accent)" }}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-mono w-10 text-right" style={{ color: (sliderValues[item.id] || 0) > 0 ? "var(--green)" : (sliderValues[item.id] || 0) < 0 ? "var(--red)" : "var(--text-dim)" }}>
                      {(sliderValues[item.id] || 0) > 0 ? "+" : ""}{sliderValues[item.id] || 0}
                    </span>
                    <input
                      type="range"
                      min={-Math.min(item.current, 50)}
                      max={Math.min(item.total - item.current, 50) || 1}
                      value={sliderValues[item.id] || 0}
                      onChange={(e) => setSliderValues((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      onMouseUp={() => logProgress(item.id)}
                      onTouchEnd={() => logProgress(item.id)}
                      onKeyUp={(e) => e.key === "Enter" && logProgress(item.id)}
                      disabled={done}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: done ? "var(--bg)" : "var(--bg)",
                        accentColor: "var(--accent)",
                      }}
                    />
                  </div>
                  <input
                    placeholder="Note"
                    value={logNotes[item.id] || ""}
                    onChange={(e) => setLogNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    disabled={done}
                    className="w-24 px-2 py-1 rounded text-xs outline-none"
                    style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                  />
                  {item.entries.length > 0 && (
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="px-2 py-1 rounded text-xs"
                      style={{ color: "var(--text-dim)" }}
                    >
                      {expandedId === item.id ? "▲" : "▼"} {item.entries.length}
                    </button>
                  )}
                </div>

                {expandedId === item.id && item.entries.length > 0 && (
                  <div className="mt-3 pt-3 space-y-1 border-t" style={{ borderColor: "var(--border)" }}>
                    {[...item.entries].reverse().map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-xs" style={{ color: "var(--text-dim)" }}>
                        <span>{e.date}</span>
                        <span>+{e.amount} {item.unit}</span>
                        {e.note && <span className="truncate ml-2">{e.note}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>{label}</p>
    </div>
  )
}
