"use client"

import { useState, useEffect, useMemo } from "react"
import type { Routine, ProgressItem } from "@/lib/types"
import FilterBar from "@/components/FilterBar"

export default function DailiesPage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [selectedFilters, setSelectedFilters] = useState<Record<string, Set<string>>>(() => ({
    frequency: new Set(["daily", "weekly"]),
    area: new Set<string>(),
  }))
  const [showCompleted, setShowCompleted] = useState(false)

  useEffect(() => {
    fetch("/api/dailies").then((r) => r.json()).then(setRoutines)
    fetch("/api/progress").then((r) => r.json()).then(setProgressItems)
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartStr = weekStart.toISOString().slice(0, 10)

  const allAreas = useMemo(() => {
    const areas = new Set<string>()
    for (const r of routines) if (r.area) areas.add(r.area)
    return Array.from(areas).sort()
  }, [routines])

  const filtered = useMemo(() => {
    let result = routines

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q)
      )
    }

    const selectedFreqs = selectedFilters.frequency
    if (selectedFreqs && selectedFreqs.size < 2) {
      result = result.filter((r) => selectedFreqs.has(r.frequency))
    }

    const selectedAreas = selectedFilters.area
    if (selectedAreas && selectedAreas.size > 0) {
      result = result.filter((r) => selectedAreas.has(r.area))
    }

    if (!showCompleted) {
      result = result.filter((r) => {
        if (r.frequency === "daily") return !r.history.includes(today)
        return !r.history.some((h) => h >= weekStartStr)
      })
    }

    return result
  }, [routines, search, selectedFilters, showCompleted, today, weekStartStr])

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
    if (r.linked_progress_id) {
      const res = await fetch("/api/progress")
      const items = await res.json()
      setProgressItems(items)
    }
    setLoading(null)
  }

  const progressMap = useMemo(() => {
    const map = new Map<string, ProgressItem>()
    for (const p of progressItems) map.set(p.id, p)
    return map
  }, [progressItems])

  function linkedLabel(r: Routine): string | null {
    if (!r.linked_progress_id) return null
    const p = progressMap.get(r.linked_progress_id)
    if (!p) return null
    const amt = r.progress_amount ?? 1
    return `→ ${p.title}: +${amt} ${p.unit}`
  }

  const daily = filtered.filter((r) => r.frequency === "daily")
  const weekly = filtered.filter((r) => r.frequency === "weekly")

  const filterConfigs = [
    {
      label: "Frequency",
      key: "frequency",
      options: [
        { label: "Daily", value: "daily", color: "var(--green)" },
        { label: "Weekly", value: "weekly", color: "var(--gold)" },
      ],
    },
    {
      label: "Area",
      key: "area",
      options: allAreas.map((a) => ({ label: a, value: a })),
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Dailies</h2>
      </div>

      <FilterBar
        searchPlaceholder="Search routines..."
        filterConfigs={filterConfigs}
        showCompleted={showCompleted}
        onShowCompletedChange={setShowCompleted}
        selected={selectedFilters}
        onSelectedChange={(key, values) => setSelectedFilters((prev) => ({ ...prev, [key]: values }))}
        search={search}
        onSearchChange={setSearch}
      />

      {daily.length > 0 && (
        <>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--green)" }}>
            Daily ({daily.length})
          </h3>
          <div className="space-y-2 mb-8">
            {daily.map((r) => {
              const done = r.history.includes(today)
              const link = linkedLabel(r)
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
                    {link && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--accent)" }}>
                        {link}
                      </p>
                    )}
                    {r.description && !link && (
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
        </>
      )}

      {weekly.length > 0 && (
        <>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--gold)" }}>
            Weekly ({weekly.length})
          </h3>
          <div className="space-y-2">
            {weekly.map((r) => {
              const done = r.history.some((h) => h >= weekStartStr)
              const link = linkedLabel(r)
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
                    {link && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--accent)" }}>
                        {link}
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
        </>
      )}

      {filtered.length === 0 && routines.length > 0 && (
        <div className="text-center py-12" style={{ color: "var(--text-dim)" }}>
          <p className="text-sm">No routines match your filters</p>
        </div>
      )}
    </div>
  )
}
