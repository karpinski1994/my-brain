"use client"

import { useState, useEffect } from "react"

function getMultiplier(streak: number) {
  if (streak >= 30) return 2
  if (streak >= 14) return 1.5
  if (streak >= 7) return 1.25
  return 1
}

export default function StreakBar() {
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [totalXp, setTotalXp] = useState(0)

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        setStreak(d.current_streak)
        setBest(d.longest_streak)
        setTotalXp(d.total_xp)
      })
  }, [])

  const mult = getMultiplier(streak)
  const tier = getNextTier(streak)
  const tierStart = streak < 7 ? 0 : streak < 14 ? 7 : 14
  const tierRange = streak < 7 ? 7 : streak < 14 ? 7 : 16
  const pct = streak >= 30 ? 100 : ((streak - tierStart) / tierRange) * 100

  return (
    <div
      className="flex items-center gap-4 px-5 py-2 text-xs border-b"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <span style={{ color: "var(--green)" }}>
        🔥 <strong>{streak}d</strong> streak
      </span>
      <span style={{ color: "var(--gold)" }}>×{mult} XP</span>
      {streak < 30 && (
        <span style={{ color: "var(--text-dim)" }}>
          {tier.next - streak}d to ×{tier.mult}
        </span>
      )}
      <div className="flex-1 max-w-[160px] h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, background: "var(--green)" }}
        />
      </div>
      <span style={{ color: "var(--text-dim)" }}>Best: {best}d</span>
      <span style={{ color: "var(--text-dim)" }}>· {totalXp} XP</span>
    </div>
  )
}

function getNextTier(streak: number): { next: number; mult: number } {
  if (streak < 7) return { next: 7, mult: 1.25 }
  if (streak < 14) return { next: 14, mult: 1.5 }
  if (streak < 30) return { next: 30, mult: 2 }
  return { next: 30, mult: 2 }
}
