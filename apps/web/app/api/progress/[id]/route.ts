import { NextResponse } from "next/server"
import { readProgress, updateProgressItem, deleteProgressItem, logProgressEntry } from "@/lib/data"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const { amount, note, ...updates } = body

  if (amount != null) {
    const updated = logProgressEntry(params.id, amount, note)
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(updated)
  }

  const updated = updateProgressItem(params.id, updates)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  deleteProgressItem(params.id)
  return NextResponse.json({ deleted: true })
}
