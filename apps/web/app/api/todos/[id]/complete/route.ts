import { NextResponse } from "next/server"
import { readTodos, completeTodo } from "@/lib/data"

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const todos = readTodos()
  const todo = todos.find((t) => t.id === params.id)
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const result = completeTodo(todo)
  return NextResponse.json(result)
}
