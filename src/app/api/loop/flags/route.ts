import { NextResponse } from "next/server"
import { liveFlags, sdkVersion, checkoutHung } from "@/lib/loop"

export const dynamic = "force-dynamic"

export async function GET() {
  const flags = await liveFlags()
  return NextResponse.json({
    flags,
    sdk: sdkVersion(flags),
    hung: checkoutHung(flags),
  })
}
