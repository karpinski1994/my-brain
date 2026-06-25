import { NextResponse } from "next/server"
import { readTodos } from "@/lib/data"

export async function GET() {
  const todos = readTodos().filter((t) => t.status === "completed")
  return NextResponse.json(todos)
}
