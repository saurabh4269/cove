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
    await postSignal({
      source: body.source || "cove",
      polarity: body.polarity || "negative",
      domain: body.domain || "funnel",
      metric: body.metric || "checkout",
      delta: body.delta,
      title: body.title,
      dimensions: body.dimensions || {},
    })
  }
  return NextResponse.json({ ok: true })
}
