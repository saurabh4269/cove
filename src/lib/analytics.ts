// Google Analytics 4 — ecommerce events for Cove → BQ export → Product OS evidence.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ""

export function isAnalyticsEnabled() {
  return Boolean(GA_ID)
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (!GA_ID) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", name, properties)
    }
    return
  }
  window.gtag?.("event", name, properties)
}

export function trackPageView(url: string) {
  if (!GA_ID) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics] pageview", url)
    }
    return
  }
  window.gtag?.("config", GA_ID, { page_path: url })
}

// GA4 recommended ecommerce event names
export const events = {
  addToCart: (product: { id: string; name: string; price: number; quantity: number }) =>
    trackEvent("add_to_cart", {
      currency: "USD",
      value: product.price * product.quantity,
      items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity }],
    }),

  removeFromCart: (product: { id: string; name: string }) =>
    trackEvent("remove_from_cart", { items: [{ item_id: product.id, item_name: product.name }] }),

  addToWishlist: (product: { id: string; name: string }) =>
    trackEvent("add_to_wishlist", { items: [{ item_id: product.id, item_name: product.name }] }),

  viewItem: (product: { id: string; name: string; price: number }) =>
    trackEvent("view_item", {
      currency: "USD",
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, price: product.price }],
    }),

  beginCheckout: (total: number, itemCount: number) =>
    trackEvent("begin_checkout", { currency: "USD", value: total, items_count: itemCount }),

  addPaymentInfo: (total: number) =>
    trackEvent("add_payment_info", { currency: "USD", value: total, payment_type: "card" }),

  purchase: (orderId: string, total: number) =>
    trackEvent("purchase", { transaction_id: orderId, currency: "USD", value: total }),

  search: (query: string, resultCount: number) =>
    trackEvent("search", { search_term: query, result_count: resultCount }),

  viewProduct: (product: { id: string; name: string; price: number }) => events.viewItem(product),

  signUp: () => trackEvent("sign_up", { method: "email" }),
  login: () => trackEvent("login", { method: "email" }),
}
