"use client"

import { useState, useEffect } from "react"
import type { Routine } from "@/lib/types"

export default function DailiesPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/dailies").then((r) => r.json()).then(setRoutines)
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  async function complete(r: Routine) {
    setLoading(r.id)
    await fetch("/api/dailies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id }),
    })
    setRoutines((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? { ...x, history: [...x.history, today] }
          : x
      )
    )
    setLoading(null)
  }

  const daily = routines.filter((r) => r.frequency === "daily")
  const weekly = routines.filter((r) => r.frequency === "weekly")

  const doneDaily = daily.filter((r) => r.history.includes(today)).length
  const doneWeekly = weekly.filter((r) => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    return r.history.some((h) => h >= weekStart.toISOString().slice(0, 10))
  }).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dailies</h2>
        <span className="text-sm" style={{ color: "var(--text-dim)" }}>
          Daily {doneDaily}/{daily.length} · Weekly {doneWeekly}/{weekly.length}
        </span>
      </div>

      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--green)" }}>
        Daily ({daily.length})
      </h3>
      <div className="space-y-2 mb-8">
        {daily.map((r) => {
          const done = r.history.includes(today)
          return (
            <div
              key={r.id}
              className="flex items-center gap-3 p-3 rounded-xl transition"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                opacity: done ? 0.5 : 1,
              }}
            >
              <button
                onClick={() => !done && complete(r)}
                disabled={done || loading === r.id}
                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition"
                style={{
                  borderColor: done ? "var(--green)" : "var(--border)",
                  background: done ? "var(--green)" : "transparent",
                }}
              >
                {done && "✓"}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ textDecoration: done ? "line-through" : "none" }}
                >
                  {r.title}
                </p>
                {r.description && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-dim)" }}>
                    {r.description}
                  </p>
                )}
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--text-dim)" }}>
                +{r.xp_value} XP
              </span>
            </div>
          )
        })}
      </div>

      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--gold)" }}>
        Weekly ({weekly.length})
      </h3>
      <div className="space-y-2">
        {weekly.map((r) => {
          const weekStart = new Date()
          weekStart.setDate(weekStart.getDate() - weekStart.getDay())
          const done = r.history.some((h) => h >= weekStart.toISOString().slice(0, 10))
          return (
            <div
              key={r.id}
              className="flex items-center gap-3 p-3 rounded-xl transition"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                opacity: done ? 0.5 : 1,
              }}
            >
              <button
                onClick={() => !done && complete(r)}
                disabled={done || loading === r.id}
                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition"
                style={{
                  borderColor: done ? "var(--green)" : "var(--border)",
                  background: done ? "var(--green)" : "transparent",
                }}
              >
                {done && "✓"}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ textDecoration: done ? "line-through" : "none" }}
                >
                  {r.title}
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--text-dim)" }}>
                +{r.xp_value} XP
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
