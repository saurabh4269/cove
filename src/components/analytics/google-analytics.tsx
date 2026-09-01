"use client"

import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { isAnalyticsEnabled, trackPageView } from "@/lib/analytics"

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""

export function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isAnalyticsEnabled()) return
    const qs = searchParams?.toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    trackPageView(url)
  }, [pathname, searchParams])

  if (!GA_ID) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  )
}
