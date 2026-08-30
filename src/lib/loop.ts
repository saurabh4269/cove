/**
 * Product OS (LOOP) tenant wire.
 * Flags: GET /api/t/{id}/flags
 * Signals / voice: POST …/signals | …/voice
 */

const OS_URL = (process.env.LOOP_OS_URL || process.env.NEXT_PUBLIC_LOOP_OS_URL || "").replace(/\/$/, "")
const TENANT = process.env.LOOP_TENANT_ID || "acme"
const TOKEN = process.env.LOOP_TENANT_TOKEN || ""

export type LoopFlags = Record<string, string>

let cache: { at: number; flags: LoopFlags } | null = null
const TTL_MS = 4000

export function sdkVersion(flags: LoopFlags): string {
  if (flags.pay_sdk_4_3 === "off") return "4.2.1"
  if (flags.pay_sdk_4_3 === "on") return "4.3.0"
  return flags.pay_sdk || "4.3.0"
}

export function checkoutHung(flags: LoopFlags): boolean {
  // Fixture energy: SDK 4.3 path can hang checkout (Type A). Flip off via OS approve.
  return flags.pay_sdk_4_3 === "on" || flags.pay_sdk === "4.3.0"
}

export async function liveFlags(): Promise<LoopFlags> {
  const fallback: LoopFlags = {
    pay_sdk_4_3: "on",
    pay_sdk: "4.3.0",
    show_delivery_date_earlier: "off",
    onboarding_copy_exp_b: "on",
  }
  if (cache && Date.now() - cache.at < TTL_MS) return cache.flags
  if (!OS_URL || !TOKEN) {
    cache = { at: Date.now(), flags: fallback }
    return fallback
  }
  try {
    const res = await fetch(`${OS_URL}/api/t/${TENANT}/flags`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`flags ${res.status}`)
    const body = (await res.json()) as { flags?: LoopFlags }
    const flags = { ...fallback, ...(body.flags || {}) }
    cache = { at: Date.now(), flags }
    return flags
  } catch {
    if (cache) return cache.flags
    return fallback
  }
}

export async function postSignal(payload: Record<string, unknown>): Promise<void> {
  if (!OS_URL || !TOKEN) return
  try {
    await fetch(`${OS_URL}/api/t/${TENANT}/signals`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch {
    /* best-effort */
  }
}

export async function postVoice(payload: Record<string, unknown>): Promise<void> {
  if (!OS_URL || !TOKEN) return
  try {
    await fetch(`${OS_URL}/api/t/${TENANT}/voice`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch {
    /* best-effort */
  }
}
