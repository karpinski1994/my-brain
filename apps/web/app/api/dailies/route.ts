import { NextResponse } from "next/server"
import { readRoutines, completeRoutine } from "@/lib/data"

export async function GET() {
  const routines = readRoutines()
  return NextResponse.json(routines)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const routines = readRoutines()
  const routine = routines.find((r) => r.id === body.id)
  if (!routine) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const result = completeRoutine(routine)
  return NextResponse.json(result)
}
