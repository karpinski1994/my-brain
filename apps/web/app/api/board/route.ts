import { NextResponse } from "next/server"
import {
  readBoard,
  readRoutines,
  readStats,
  readXPEvents,
  calculateLevel,
  completeRoutine,
  addJournalEntry,
  updateRevenue,
  updateJournalPosted,
  getRoutineCountThisWeek,
  getDailyCompletionCount,
} from "@/lib/data"

export async function GET() {
  const board = readBoard()
  const stats = readStats()
  const { level } = calculateLevel(stats.total_xp)
  const events = readXPEvents()

  const postsThisWeek = getRoutineCountThisWeek(board.posts_routine_id)
  const exerciseThisWeek = getRoutineCountThisWeek(board.exercise_routine_id)
  const { done: dailiesDone, total: dailiesTotal } = getDailyCompletionCount()

  return NextResponse.json({
    revenue_this_month: board.revenue_this_month,
    revenue_goal: board.revenue_goal,
    posts_this_week: postsThisWeek,
    posts_this_week_max: 7,
    exercise_this_week: exerciseThisWeek,
    exercise_this_week_max: 7,
    dailies_done_today: dailiesDone,
    dailies_total_today: dailiesTotal,
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
