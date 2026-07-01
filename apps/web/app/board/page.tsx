"use client"

import { useState, useEffect, useRef } from "react"

interface BoardData {
  revenue_this_month: number
  revenue_goal: number
  posts_this_week: number
  posts_this_week_max: number
  exercise_this_week: number
  exercise_this_week_max: number
  dailies_done_today: number
  dailies_total_today: number
  journal: { date: string; text: string; posted: boolean }[]
  recent_events: { source_title: string; total: number; date: string; source: string }[]
  stats: { level: number; total_xp: number; current_streak: number; longest_streak: number }
}

export default function BoardPage() {
  const [data, setData] = useState<BoardData | null>(null)
  const [postText, setPostText] = useState("")
  const [posting, setPosting] = useState(false)
  const [postDone, setPostDone] = useState(false)
  const [revenueEditing, setRevenueEditing] = useState(false)
  const [revenueInput, setRevenueInput] = useState("")
  const [revenueSaving, setRevenueSaving] = useState(false)
  const revenueInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/board").then((r) => r.json()).then(setData)
  }, [])

  useEffect(() => {
    if (revenueEditing && revenueInputRef.current) {
      revenueInputRef.current.focus()
      revenueInputRef.current.select()
    }
  }, [revenueEditing])

  async function handlePost() {
    if (!postText.trim() || posting) return
    setPosting(true)
    await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "journal", text: postText.trim() }),
    })
    setPostText("")
    setPosting(false)
    setPostDone(true)
    setTimeout(() => setPostDone(false), 3000)
    const res = await fetch("/api/board")
    setData(await res.json())
  }

  async function handleRevenueSave() {
    const amount = Number(revenueInput)
    if (isNaN(amount)) return
    setRevenueSaving(true)
    await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revenue", amount }),
    })
    setRevenueSaving(false)
    setRevenueEditing(false)
    const res = await fetch("/api/board")
    setData(await res.json())
  }

  async function markPosted(index: number) {
    await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_posted", index }),
    })
    const res = await fetch("/api/board")
    setData(await res.json())
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "var(--text-dim)" }}>Loading board...</p>
      </div>
    )
  }

  const postsPct = data.posts_this_week_max > 0
    ? Math.round((data.posts_this_week / data.posts_this_week_max) * 100)
    : 0
  const revenuePct = data.revenue_goal > 0
    ? Math.round((data.revenue_this_month / data.revenue_goal) * 100)
    : 0
  const exercisePct = data.exercise_this_week_max > 0
    ? Math.round((data.exercise_this_week / data.exercise_this_week_max) * 100)
    : 0

  const weeksDone = Array.from({ length: data.posts_this_week_max }, (_, i) => i < data.posts_this_week)
  const exerciseDots = Array.from({ length: data.exercise_this_week_max }, (_, i) => i < data.exercise_this_week)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold">Board</h2>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-dim)" }}>
          <span>🔥 {data.stats.current_streak}d streak</span>
          <span>Lv.{data.stats.level}</span>
          <span>{data.stats.total_xp} XP</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <MetricCard
          icon="📝"
          label="Posts"
          value={`${data.posts_this_week}/${data.posts_this_week_max}`}
          sublabel="this week"
          pct={postsPct}
          color="var(--accent)"
          dots={weeksDone}
        />
        <MetricCard
          icon="💰"
          label="Revenue"
          value={`$${(data.revenue_this_month / 1000).toFixed(1)}K`}
          sublabel={`of $${(data.revenue_goal / 1000).toFixed(0)}K goal`}
          pct={revenuePct}
          color="var(--green)"
          editing={revenueEditing}
          onEdit={() => { setRevenueEditing(true); setRevenueInput(String(data.revenue_this_month)) }}
          editContent={
            revenueEditing ? (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs" style={{ color: "var(--text-dim)" }}>$</span>
                <input
                  ref={revenueInputRef}
                  type="number"
                  value={revenueInput}
                  onChange={(e) => setRevenueInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRevenueSave()}
                  onBlur={handleRevenueSave}
                  className="w-20 px-1.5 py-0.5 rounded text-xs outline-none"
                  style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
                {revenueSaving && <span className="text-xs" style={{ color: "var(--text-dim)" }}>...</span>}
              </div>
            ) : null
          }
        />
        <MetricCard
          icon="🏋️"
          label="Exercise"
          value={`${data.exercise_this_week}/${data.exercise_this_week_max}`}
          sublabel="sessions this week"
          pct={exercisePct}
          color="var(--gold)"
          dots={exerciseDots}
        />
      </div>

      <div
        className="flex items-center gap-3 mb-6 px-4 py-2.5 rounded-xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <span className="text-sm">🗓️</span>
        <span className="text-sm font-medium">
          Today: <span style={{ color: "var(--green)" }}>{data.dailies_done_today}/{data.dailies_total_today}</span> dailies done
        </span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${data.dailies_total_today > 0 ? Math.round((data.dailies_done_today / data.dailies_total_today) * 100) : 0}%`,
              background: "var(--accent)",
            }}
          />
        </div>
        <a
          href="/dailies"
          className="text-xs px-2.5 py-1 rounded transition"
          style={{ background: "var(--bg)", color: "var(--text-dim)" }}
        >
          View all →
        </a>
      </div>

      <div
        className="rounded-xl p-5 mb-6 transition-all"
        style={{ background: postDone ? "var(--card)" : "var(--card)", border: postDone ? "2px solid var(--green)" : "1px solid var(--border)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-dim)" }}>
          📝 Document, Don&apos;t Create
        </h3>
        <p className="text-xs mb-3" style={{ color: "var(--text-dim)" }}>
          One thing I noticed or learned today
        </p>
        <textarea
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost()
          }}
          placeholder="Today I noticed that..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg outline-none text-sm resize-none mb-3"
          style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
            {postDone ? "✅ Saved! Routine completed. +XP earned." : "⌘+Enter to post"}
          </span>
          <button
            onClick={handlePost}
            disabled={!postText.trim() || posting}
            className="px-4 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-40"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {posting ? "Posting..." : "Post →"}
          </button>
        </div>
      </div>

      {data.journal.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-dim)" }}>
            📋 Recent Journal
          </h3>
          <div className="space-y-1.5">
            {[...data.journal].reverse().slice(0, 10).map((entry, i) => {
              const realIndex = data.journal.length - 1 - i
              return (
                <div
                  key={realIndex}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <button
                    onClick={() => !entry.posted && markPosted(realIndex)}
                    className="flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] transition"
                    style={{
                      borderColor: entry.posted ? "var(--green)" : "var(--border)",
                      background: entry.posted ? "var(--green)" : "transparent",
                      color: entry.posted ? "#fff" : "transparent",
                      cursor: entry.posted ? "default" : "pointer",
                    }}
                    title={entry.posted ? "Posted to LinkedIn" : "Mark as posted"}
                  >
                    {entry.posted ? "✓" : ""}
                  </button>
                  <span style={{ color: "var(--text-dim)", flexShrink: 0 }}>{entry.date}</span>
                  <span className="truncate">{entry.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {data.recent_events.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-dim)" }}>
            ⚡ Recent XP
          </h3>
          <div className="space-y-1">
            {data.recent_events.slice(0, 5).map((ev, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <span className="truncate" style={{ color: "var(--text-dim)" }}>
                  {ev.source === "daily_complete" ? "↻" : "☐"} {ev.source_title}
                </span>
                <span className="font-mono flex-shrink-0 ml-3" style={{ color: "var(--gold)" }}>
                  +{ev.total} XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  sublabel,
  pct,
  color,
  dots,
  editing,
  onEdit,
  editContent,
}: {
  icon: string
  label: string
  value: string
  sublabel: string
  pct: number
  color: string
  dots?: boolean[]
  editing?: boolean
  onEdit?: () => void
  editContent?: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col transition hover:scale-[1.02] cursor-default"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      onClick={onEdit}
    >
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-xs font-medium" style={{ color: "var(--text-dim)" }}>{label}</span>
      </div>

      {editing && editContent ? (
        editContent
      ) : (
        <span className="text-2xl font-bold" style={{ color }}>
          {value}
        </span>
      )}

      <div className="w-full h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "var(--bg)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>{sublabel}</span>
        {dots && (
          <div className="flex gap-0.5">
            {dots.map((done, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition"
                style={{ background: done ? color : "var(--bg)" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


