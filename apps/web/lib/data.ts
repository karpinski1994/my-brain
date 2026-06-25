import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { parse, stringify } from "yaml"
import type { Todo, TodoFile, Routine, Stats, XPEvent } from "./types"

const DATA_DIR = path.resolve(
  process.cwd(),
  "../../.opencode/skills/mybrain/data"
)

export function getDataDir(): string {
  return DATA_DIR
}

export function readTodos(): Todo[] {
  const dir = path.join(DATA_DIR, "todos")
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"))
  return files
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf-8")
      const { data } = matter(raw)
      return data as Todo
    })
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 }
      return (p[a.priority] ?? 1) - (p[b.priority] ?? 1)
    })
}

export function writeTodo(todo: Todo): void {
  const slug = `${todo.created.slice(0, 10)}--${todo.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40)}`
  const frontmatter = matter.stringify("", {
    ...todo,
    tags: todo.tags || [],
    parent_id: todo.parent_id || null,
    completed: todo.completed || null,
  })
  fs.writeFileSync(path.join(DATA_DIR, "todos", `${slug}.md`), frontmatter)
}

export function readRoutines(): Routine[] {
  const file = path.join(DATA_DIR, "routines", "dailies.yaml")
  if (!fs.existsSync(file)) return []
  const raw = fs.readFileSync(file, "utf-8")
  const parsed = parse(raw)
  return (parsed.routines || []) as Routine[]
}

export function writeRoutines(routines: Routine[]): void {
  const file = path.join(DATA_DIR, "routines", "dailies.yaml")
  const content = stringify({ routines })
  fs.writeFileSync(file, content)
}

export function readStats(): Stats {
  const file = path.join(DATA_DIR, "xp", "stats.yaml")
  if (!fs.existsSync(file))
    return {
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      daily_calorie_goal: 2000,
    }
  const raw = fs.readFileSync(file, "utf-8")
  return parse(raw) as Stats
}

export function writeStats(stats: Stats): void {
  const file = path.join(DATA_DIR, "xp", "stats.yaml")
  const content = stringify(stats)
  fs.writeFileSync(file, content)
}

export function readXPEvents(): XPEvent[] {
  const file = path.join(DATA_DIR, "xp", "events.yaml")
  if (!fs.existsSync(file)) return []
  const raw = fs.readFileSync(file, "utf-8")
  const parsed = parse(raw)
  return (parsed.events || []) as XPEvent[]
}

export function appendXPEvent(event: XPEvent): void {
  const events = readXPEvents()
  events.push(event)
  const file = path.join(DATA_DIR, "xp", "events.yaml")
  const content = stringify({ events })
  fs.writeFileSync(file, content)
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0
  if (streak >= 14) return 1.5
  if (streak >= 7) return 1.25
  return 1.0
}

export function calculateLevel(totalXp: number): {
  level: number
  xpForNext: number
  xpNeeded: number
} {
  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1
  const xpForNext = level * level * 100
  const xpNeeded = xpForNext - totalXp
  return { level, xpForNext, xpNeeded }
}

export function updateStreak(stats: Stats, date: string): number {
  const today = date
  const last = stats.last_activity_date
  if (!last) {
    stats.current_streak = 1
  } else if (last === today) {
    return stats.current_streak
  } else if (last === getYesterday(today)) {
    stats.current_streak += 1
  } else {
    stats.current_streak = 1
  }
  stats.last_activity_date = today
  if (stats.current_streak > stats.longest_streak) {
    stats.longest_streak = stats.current_streak
  }
  return stats.current_streak
}

function getYesterday(date: string): string {
  const d = new Date(date + "T00:00:00")
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function completeTodo(todo: Todo): {
  todo: Todo
  xpEarned: number
  streak: number
  totalXp: number
} {
  const stats = readStats()
  const today = new Date().toISOString().slice(0, 10)
  const streak = updateStreak(stats, today)
  const multiplier = getStreakMultiplier(streak)
  const xpEarned = Math.round(todo.xp_value * multiplier)

  stats.total_xp += xpEarned
  writeStats(stats)

  appendXPEvent({
    id: crypto.randomUUID(),
    source: "todo_complete",
    source_title: todo.title,
    xp_awarded: todo.xp_value,
    multiplier,
    total: xpEarned,
    skill_tree: todo.area || "general",
    date: today,
  })

  todo.status = "completed"
  todo.completed = new Date().toISOString()
  writeTodo(todo)

  return { todo, xpEarned, streak, totalXp: stats.total_xp }
}

export function completeRoutine(
  routine: Routine
): {
  xpEarned: number
  streak: number
  totalXp: number
} {
  const stats = readStats()
  const today = new Date().toISOString().slice(0, 10)
  const streak = updateStreak(stats, today)
  const multiplier = getStreakMultiplier(streak)
  const xpEarned = Math.round(routine.xp_value * multiplier)

  stats.total_xp += xpEarned
  writeStats(stats)

  if (!routine.history.includes(today)) {
    routine.history.push(today)
  }
  const routines = readRoutines()
  const idx = routines.findIndex((r) => r.id === routine.id)
  if (idx !== -1) {
    routines[idx] = routine
    writeRoutines(routines)
  }

  appendXPEvent({
    id: crypto.randomUUID(),
    source: "daily_complete",
    source_title: routine.title,
    xp_awarded: routine.xp_value,
    multiplier,
    total: xpEarned,
    skill_tree: routine.area || "general",
    date: today,
  })

  return { xpEarned, streak, totalXp: stats.total_xp }
}
