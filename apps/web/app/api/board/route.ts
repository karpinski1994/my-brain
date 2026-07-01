import { NextResponse } from "next/server"
import {
  readBoard,
  readRoutines,
  readProgress,
  readStats,
  readXPEvents,
  calculateLevel,
  completeRoutine,
  addJournalEntry,
  updateRevenue,
  updateJournalPosted,
  getPostCountThisWeek,
} from "@/lib/data"

export async function GET() {
  const board = readBoard()
  const stats = readStats()
  const { level } = calculateLevel(stats.total_xp)
  const events = readXPEvents()
  const progress = readProgress()

  const postsThisWeek = getPostCountThisWeek()

  const freediving = board.freediving_item_id
    ? progress.find((p) => p.id === board.freediving_item_id) ?? null
    : null
  const pullups = board.pullups_item_id
    ? progress.find((p) => p.id === board.pullups_item_id) ?? null
    : null

  return NextResponse.json({
    revenue_this_month: board.revenue_this_month,
    revenue_goal: board.revenue_goal,
    posts_this_week: postsThisWeek,
    posts_this_week_max: 7,
    freediving: freediving
      ? { title: freediving.title, current: freediving.current, total: freediving.total, unit: freediving.unit }
      : null,
    pullups: pullups
      ? { title: pullups.title, current: pullups.current, total: pullups.total, unit: pullups.unit }
      : null,
    journal: board.journal,
    recent_events: events.slice(-10).reverse(),
    stats: {
      level,
      total_xp: stats.total_xp,
      current_streak: stats.current_streak,
      longest_streak: stats.longest_streak,
    },
  })
}

export async function POST(req: Request) {
  const body = await req.json()

  if (body.action === "journal") {
    const entry = addJournalEntry(body.text)
    const routines = readRoutines()
    const board = readBoard()
    const postRoutine = routines.find((r) => r.id === board.posts_routine_id)
    if (postRoutine) {
      const today = new Date().toISOString().slice(0, 10)
      if (!postRoutine.history.includes(today)) {
        completeRoutine(postRoutine)
      }
    }
    return NextResponse.json({ entry })
  }

  if (body.action === "revenue") {
    updateRevenue(Number(body.amount))
    return NextResponse.json({ revenue_this_month: Number(body.amount) })
  }

  if (body.action === "mark_posted") {
    updateJournalPosted(Number(body.index))
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
