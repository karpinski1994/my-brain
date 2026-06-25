import { NextResponse } from "next/server"
import { readTodos, writeTodo } from "@/lib/data"
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

  const fs = await import("fs")
  const path = await import("path")
  const dir = path.resolve(
    process.cwd(),
    "../../.opencode/skills/mybrain/data/todos"
  )
  const files = fs.readdirSync(dir)
  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), "utf-8")
    if (raw.includes(params.id)) {
      fs.unlinkSync(path.join(dir, f))
      break
    }
  }
  return NextResponse.json({ deleted: true })
}
