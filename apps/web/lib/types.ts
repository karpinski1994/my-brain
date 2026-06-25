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
