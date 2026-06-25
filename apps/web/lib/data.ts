import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { parse, stringify } from "yaml"
import type { Todo, Routine, Stats, XPEvent, ProgressItem, ProgressEntry } from "./types"

const VAULT_DIR = path.resolve(process.cwd(), "../../my-brain/03_System")
const DATA_DIR = path.resolve(process.cwd(), "../../.opencode/skills/mybrain/data")

export function getDataDir(): string {
  return DATA_DIR
}

// ---------------------------------------------------------------------------
// TODOS
// ---------------------------------------------------------------------------

export function readTodos(): Todo[] {
  const file = path.join(VAULT_DIR, "todos.md")
  if (!fs.existsSync(file)) return []
  const raw = fs.readFileSync(file, "utf-8")
  const { data } = matter(raw)
  const todos = (data.todos || []) as Todo[]
  const p = { high: 0, medium: 1, low: 2 }
  return todos.sort((a, b) => (p[a.priority] ?? 1) - (p[b.priority] ?? 1))
}

function genTodosMd(todos: Todo[]): string {
  const total = todos.length
  const pending = todos.filter((t) => t.status === "pending").length
  const completed = total - pending
  const totalXp = todos
    .filter((t) => t.status === "completed")
    .reduce((s, t) => s + t.xp_value, 0)

  let body = `# Tasks Database\n\n> Last updated: ${new Date().toISOString().slice(0, 10)}\n\n**Stats:** ${completed}/${total} done · ${totalXp} XP earned\n`

  const groups = [
    { label: "🔴 High Priority", filter: (t: Todo) => t.status === "pending" && t.priority === "high" },
    { label: "🟡 Medium Priority", filter: (t: Todo) => t.status === "pending" && t.priority === "medium" },
    { label: "🔵 Low Priority", filter: (t: Todo) => t.status === "pending" && t.priority === "low" },
  ]
  for (const g of groups) {
    const items = todos.filter(g.filter)
    if (!items.length) continue
    body += `\n### ${g.label}\n| Status | Task | XP | Tags |\n|--------|------|----|------|\n`
    for (const t of items) {
      const tags = (t.tags || []).join(", ")
      body += `| ⬜ | ${t.title}${t.parent_id ? " *(subtask)*" : ""} | ${t.xp_value} | ${tags} |\n`
    }
  }

  const done = todos.filter((t) => t.status === "completed")
  if (done.length) {
    body += `\n### ✅ Completed\n| Task | XP | Done |\n|------|----|------|\n`
    for (const t of done) {
      body += `| ✅ ${t.title} | ${t.xp_value} | ${t.completed ? t.completed.slice(0, 10) : ""} |\n`
    }
  }

  const frontmatter = {
    type: "database",
    name: "todos",
    updated: new Date().toISOString(),
    total,
    pending,
    completed,
    total_xp_earned: totalXp,
    todos: todos.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      priority: t.priority,
      status: t.status,
      xp_value: t.xp_value,
      tags: t.tags || [],
      area: t.area || "",
      parent_id: t.parent_id || null,
      created: t.created,
      completed: t.completed || null,
    })),
  }

  return matter.stringify(body, frontmatter)
}

export function writeTodo(todo: Todo): void {
  let todos = readTodos()
  const idx = todos.findIndex((t) => t.id === todo.id)
  if (idx !== -1) {
    todos[idx] = todo
  } else {
    todos.push(todo)
  }
  fs.writeFileSync(path.join(VAULT_DIR, "todos.md"), genTodosMd(todos))
}

export function deleteTodo(id: string): void {
  let todos = readTodos().filter((t) => t.id !== id)
  fs.writeFileSync(path.join(VAULT_DIR, "todos.md"), genTodosMd(todos))
}

// ---------------------------------------------------------------------------
// DAILIES / ROUTINES
// ---------------------------------------------------------------------------

export function readRoutines(): Routine[] {
  const file = path.join(VAULT_DIR, "dailies.md")
  if (!fs.existsSync(file)) return []
  const raw = fs.readFileSync(file, "utf-8")
  const { data } = matter(raw)
  return (data.routines || []) as Routine[]
}

function genDailiesMd(routines: Routine[], extras: Record<string, any>): string {
  const today = new Date().toISOString().slice(0, 10)
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartStr = weekStart.toISOString().slice(0, 10)
  const daily = routines.filter((r) => r.frequency === "daily")
  const weekly = routines.filter((r) => r.frequency === "weekly")
  const dailyDone = daily.filter((r) => r.history.includes(today)).length
  const weeklyDone = weekly.filter((r) => r.history.some((h) => h >= weekStartStr)).length

  let body = `# Dailies Database\n\n> Last updated: ${today}\n\n**Streak:** ${extras.current_streak ?? 0}d · **Best:** ${extras.longest_streak ?? 0}d · **Daily:** ${dailyDone}/${daily.length} · **Weekly:** ${weeklyDone}/${weekly.length}\n`

  body += "\n## Daily Routines\n| Status | Task | XP | Area |\n|--------|------|----|------|\n"
  for (const r of daily) {
    const done = r.history.includes(today)
    body += `| ${done ? "✅" : "⬜"} | ${r.title} | ${r.xp_value} | ${r.area || ""} |\n`
  }

  body += "\n## Weekly Routines\n| Status | Task | XP | Area |\n|--------|------|----|------|\n"
  for (const r of weekly) {
    const done = r.history.some((h) => h >= weekStartStr)
    body += `| ${done ? "✅" : "⬜"} | ${r.title} | ${r.xp_value} | ${r.area || ""} |\n`
  }

  const frontmatter = {
    type: "database",
    name: "dailies",
    updated: new Date().toISOString(),
    current_streak: extras.current_streak ?? 0,
    longest_streak: extras.longest_streak ?? 0,
    last_activity_date: extras.last_activity_date || null,
    total_xp: extras.total_xp ?? 0,
    daily_calorie_goal: extras.daily_calorie_goal ?? 2000,
      routines: routines.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description || "",
        frequency: r.frequency,
        xp_value: r.xp_value,
        area: r.area || "",
        history: r.history || [],
        linked_progress_id: r.linked_progress_id || null,
        progress_amount: r.progress_amount ?? 1,
      })),
  }

  return matter.stringify(body, frontmatter)
}

export function writeRoutines(routines: Routine[]): void {
  const extras = readDailiesExtras()
  fs.writeFileSync(path.join(VAULT_DIR, "dailies.md"), genDailiesMd(routines, extras))
}

function readDailiesExtras(): Record<string, any> {
  const file = path.join(VAULT_DIR, "dailies.md")
  if (!fs.existsSync(file)) return { current_streak: 0, longest_streak: 0, last_activity_date: null, total_xp: 0, daily_calorie_goal: 2000 }
  const raw = fs.readFileSync(file, "utf-8")
  const { data } = matter(raw)
  return {
    current_streak: data.current_streak ?? 0,
    longest_streak: data.longest_streak ?? 0,
    last_activity_date: data.last_activity_date || null,
    total_xp: data.total_xp ?? 0,
    daily_calorie_goal: data.daily_calorie_goal ?? 2000,
  }
}

// ---------------------------------------------------------------------------
// STATS (from dailies.md + events.yaml)
// ---------------------------------------------------------------------------

export function readStats(): Stats {
  const extras = readDailiesExtras()
  return {
    total_xp: extras.total_xp,
    current_streak: extras.current_streak,
    longest_streak: extras.longest_streak,
    last_activity_date: extras.last_activity_date,
    daily_calorie_goal: extras.daily_calorie_goal,
  }
}

export function writeStats(stats: Stats): void {
  const file = path.join(VAULT_DIR, "dailies.md")
  const raw = fs.readFileSync(file, "utf-8")
  const { data } = matter(raw)
  const routines = (data.routines || []) as Routine[]
  fs.writeFileSync(
    path.join(VAULT_DIR, "dailies.md"),
    genDailiesMd(routines, { ...stats, routines })
  )
}

// ---------------------------------------------------------------------------
// PROGRESSION (books, courses, etc.)
// ---------------------------------------------------------------------------

function genProgressMd(items: ProgressItem[]): string {
  const total = items.length
  const complete = items.filter((i) => i.status === "completed").length

  let body = `# Progression Database\n\n> Last updated: ${new Date().toISOString().slice(0, 10)}\n\n**Total:** ${total} · **Completed:** ${complete}\n`

  for (const item of items) {
    const pct = item.total > 0 ? Math.round((item.current / item.total) * 100) : 0
    const statusIcon = item.status === "completed" ? "✅" : "🔄"
    body += `\n### ${statusIcon} ${item.title}\n`
    body += `| Category | Unit | Progress |\n|----------|------|----------|\n`
    body += `| ${item.category} | ${item.unit} | ${item.current}/${item.total} (${pct}%) |\n`
    if (item.entries.length > 0) {
      body += "\n**Log:**\n| Date | Amount | Note |\n|------|--------|------|\n"
      for (const e of item.entries) {
        body += `| ${e.date} | +${e.amount} ${item.unit} | ${e.note || ""} |\n`
      }
    }
  }

  const frontmatter = {
    type: "database",
    name: "progression",
    updated: new Date().toISOString(),
    items: items.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description || "",
      category: i.category,
      unit: i.unit,
      total: i.total,
      current: i.current,
      status: i.status,
      entries: (i.entries || []).map((e) => ({ date: e.date, amount: e.amount, note: e.note || "" })),
      created: i.created,
      updated: i.updated,
    })),
  }

  return matter.stringify(body, frontmatter)
}

export function readProgress(): ProgressItem[] {
  const file = path.join(VAULT_DIR, "progress.md")
  if (!fs.existsSync(file)) return []
  const raw = fs.readFileSync(file, "utf-8")
  const { data } = matter(raw)
  return (data.items || []) as ProgressItem[]
}

function writeProgress(items: ProgressItem[]): void {
  fs.writeFileSync(path.join(VAULT_DIR, "progress.md"), genProgressMd(items))
}

export function createProgressItem(item: ProgressItem): void {
  const items = readProgress()
  items.push(item)
  writeProgress(items)
}

export function updateProgressItem(id: string, updates: Partial<ProgressItem>): ProgressItem | null {
  const items = readProgress()
  const idx = items.findIndex((i) => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates, updated: new Date().toISOString() }
  writeProgress(items)
  return items[idx]
}

export function deleteProgressItem(id: string): void {
  const items = readProgress().filter((i) => i.id !== id)
  writeProgress(items)
}

export function logProgressEntry(id: string, amount: number, note?: string): ProgressItem | null {
  const items = readProgress()
  const idx = items.findIndex((i) => i.id === id)
  if (idx === -1) return null
  const entry = { date: new Date().toISOString().slice(0, 10), amount, note: note || "" }
  items[idx].entries.push(entry)
  items[idx].current = Math.max(0, items[idx].current + amount)
  if (items[idx].current >= items[idx].total) {
    items[idx].current = items[idx].total
    items[idx].status = "completed"
  } else if (items[idx].status === "completed" && items[idx].current < items[idx].total) {
    items[idx].status = "in_progress"
  }
  items[idx].updated = new Date().toISOString()
  writeProgress(items)
  return items[idx]
}

// ---------------------------------------------------------------------------
// XP EVENTS
// ---------------------------------------------------------------------------

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
  fs.writeFileSync(file, stringify({ events }))
}

// ---------------------------------------------------------------------------
// STREAK / XP ENGINE
// ---------------------------------------------------------------------------

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

  if (routine.linked_progress_id) {
    const amount = routine.progress_amount ?? 1
    try {
      logProgressEntry(routine.linked_progress_id, amount, `via ${routine.title}`)
    } catch {
      // linked progress item may not exist — ignore
    }
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
