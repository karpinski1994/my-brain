"use client"

import { useState, useEffect } from "react"

interface StatsData {
  total_xp: number
  current_streak: number
  longest_streak: number
  level: number
  xp_to_next: number
  xp_for_next: number
  recent_events: {
    id: string
    source: string
    source_title: string
    total: number
    date: string
  }[]
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats)
  }, [])

  if (!stats) return <p style={{ color: "var(--text-dim)" }}>Loading...</p>

  const xpPct = Math.round(
    ((stats.xp_for_next - stats.xp_to_next) / stats.xp_for_next) * 100
  )

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Stats</h2>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Level" value={String(stats.level)} color="var(--accent)" />
        <StatCard label="Total XP" value={String(stats.total_xp)} color="var(--gold)" />
        <StatCard label="Streak" value={`${stats.current_streak}d`} color="var(--green)" />
        <StatCard label="Best Streak" value={`${stats.longest_streak}d`} color="var(--blue)" />
      </div>

      <div className="mb-8 p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: "var(--text-dim)" }}>Level {stats.level} → {stats.level + 1}</span>
          <span style={{ color: "var(--text-dim)" }}>{stats.xp_to_next} XP remaining</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${xpPct}%`, background: "var(--accent)" }}
          />
        </div>
      </div>

      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-dim)" }}>
        Recent Activity
      </h3>
      <div className="space-y-2">
        {stats.recent_events.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>No activity yet. Complete some tasks!</p>
        ) : (
          stats.recent_events.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between p-3 rounded-xl text-sm"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <span className="truncate">{e.source_title}</span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>{e.date}</span>
                <span className="font-mono text-xs" style={{ color: "var(--green)" }}>+{e.total} XP</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="p-4 rounded-xl text-center"
      style={{ background: "var(--card)", border: `1px solid var(--border)` }}
    >
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>{label}</p>
    </div>
  )
}
