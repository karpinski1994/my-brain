import { NextResponse } from "next/server"
import { readTodos, writeTodo } from "@/lib/data"
import type { Todo } from "@/lib/types"

export async function GET() {
  const todos = readTodos().filter((t) => t.status === "pending")
  return NextResponse.json(todos)
}

export async function POST(req: Request) {
  const body = await req.json()
  const xpMap: Record<string, number> = { low: 5, medium: 10, high: 20 }
  const todo: Todo = {
    id: crypto.randomUUID(),
    title: body.title,
    description: body.description || "",
    priority: body.priority || "medium",
    tags: body.tags || [],
    area: body.area || "general",
    status: "pending",
    xp_value: xpMap[body.priority || "medium"] || 10,
    parent_id: body.parent_id || null,
    created: new Date().toISOString(),
    completed: null,
  }
  writeTodo(todo)
  return NextResponse.json(todo, { status: 201 })
}
