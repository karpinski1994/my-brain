export interface Todo {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  tags: string[]
  area: string
  status: "pending" | "completed"
  xp_value: number
  parent_id: string | null
  created: string
  completed: string | null
}

export interface TodoFile {
  id: string
  title: string
  description: string
  priority: string
  tags: string[]
  area: string
  status: string
  xp_value: number
  parent_id: string | null
  created: string
  completed: string | null
}

export interface Routine {
  id: string
  title: string
  description: string
  frequency: "daily" | "weekly"
  xp_value: number
  area: string
  history: string[]
  linked_progress_id?: string | null
  progress_amount?: number
}

export interface Stats {
  total_xp: number
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  daily_calorie_goal: number
}

export interface TodayFocus {
  date: string
  focus_tasks: { id: string; order: number }[]
}

export interface ProgressEntry {
  date: string
  amount: number
  note?: string
}

export interface ProgressItem {
  id: string
  title: string
  description?: string
  category: string
  unit: string
  total: number
  current: number
  status: "in_progress" | "completed"
  entries: ProgressEntry[]
  created: string
  updated: string
}

export interface XPEvent {
  id: string
  source: string
  source_title: string
  xp_awarded: number
  multiplier: number
  total: number
  skill_tree: string
  date: string
}

export interface JournalEntry {
  date: string
  text: string
  posted: boolean
}

export interface BoardData {
  revenue_this_month: number
  revenue_goal: number
  revenue_month: string
  revenue_last_updated: string
  posts_routine_id: string
  exercise_routine_id: string
  journal: JournalEntry[]
}

export interface BoardResponse {
  revenue_this_month: number
  revenue_goal: number
  posts_this_week: number
  posts_this_week_max: number
  exercise_this_week: number
  exercise_this_week_max: number
  dailies_done_today: number
  dailies_total_today: number
  journal: JournalEntry[]
  recent_events: XPEvent[]
  stats: {
    level: number
    total_xp: number
    current_streak: number
    longest_streak: number
  }
}
