import { NextResponse } from "next/server"
import { readProgress, createProgressItem } from "@/lib/data"
import type { ProgressItem } from "@/lib/types"

export async function GET() {
  const items = readProgress()
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const body = await req.json()
  const item: ProgressItem = {
    id: `progress-${crypto.randomUUID().slice(0, 8)}`,
    title: body.title,
    description: body.description || "",
    category: body.category || "other",
    unit: body.unit || "units",
    total: Number(body.total) || 1,
    current: Number(body.current) || 0,
    status: "in_progress",
    entries: [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }
  createProgressItem(item)
  return NextResponse.json(item, { status: 201 })
}
