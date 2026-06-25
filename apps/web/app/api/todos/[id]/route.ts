import { NextResponse } from "next/server"
import { readTodos, writeTodo, deleteTodo } from "@/lib/data"
import type { Todo } from "@/lib/types"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const todos = readTodos()
  const todo = todos.find((t) => t.id === params.id)
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const updated: Todo = { ...todo, ...body }
  writeTodo(updated)
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const todos = readTodos()
  const todo = todos.find((t) => t.id === params.id)
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 })

  deleteTodo(params.id)
  return NextResponse.json({ deleted: true })
}
