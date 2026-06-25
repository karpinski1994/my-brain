import { NextResponse } from "next/server"
import { readStats, calculateLevel, readXPEvents } from "@/lib/data"

export async function GET() {
  const stats = readStats()
  const { level, xpNeeded, xpForNext } = calculateLevel(stats.total_xp)
  const events = readXPEvents()
  const recentEvents = events.slice(-20).reverse()
  return NextResponse.json({
    ...stats,
    level,
    xp_to_next: xpNeeded,
    xp_for_next: xpForNext,
    recent_events: recentEvents,
  })
}
