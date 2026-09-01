import { NextResponse } from "next/server"
import { postSignal, postVoice } from "@/lib/loop"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const kind = String(body.kind || "signal")
  if (kind === "voice") {
    await postVoice({
      text: body.text || body.message || "",
      sentiment: body.sentiment || "mixed",
      phone: body.phone || (body.meta as { phone?: string } | undefined)?.phone || "",
      source: "cove.feedback",
      meta: body.meta || {},
    })
  } else {
    const delta = typeof body.delta === "number" ? body.delta : undefined
    const out = await postSignal({
      source: body.source || "cove",
      polarity: body.polarity || "negative",
      domain: body.domain || "funnel",
      metric: body.metric || "checkout_conversion",
      delta,
      magnitude: body.magnitude,
      baseline: body.baseline,
      title: body.title,
      note: body.note,
      dimensions: body.dimensions || {},
    })
    if (!out.ok) {
      return NextResponse.json({ ok: false, detail: "Product OS unreachable" }, { status: 502 })
    }
  }
  return NextResponse.json({ ok: true })
}
