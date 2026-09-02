import { headers } from "next/headers"
import { siteConfig } from "@/lib/config"

/** Request-aware site URL for SEO (canonical, Open Graph). */
export async function getRequestSiteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "")
  if (fromEnv) return fromEnv

  try {
    const h = await headers()
    const host = h.get("x-forwarded-host") || h.get("host")
    if (host) {
      const proto =
        h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https")
      return `${proto}://${host}`.replace(/\/$/, "")
    }
  } catch {
    /* build / static generation */
  }

  return siteConfig.url
}
