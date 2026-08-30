// Store Configuration — Cove (Product Y for Product OS)

export const siteConfig = {
  name: "Cove",
  tagline: "Everyday goods, carefully made.",
  description:
    "Cove is a real storefront wired to Product OS — live feature flags, checkout signals, and customer voice land in the control plane.",

  announcement: "Free shipping over $75. Checkout reads live flags from Product OS.",

  url: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",

  contact: {
    email: "hello@cove.example",
    phone: "",
    address: {
      street: "",
      suite: "",
      city: "",
      state: "",
      zip: "",
    },
  },

  social: {
    twitter: "",
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
  },

  freeShippingThreshold: 7500,
  taxRate: 0.08,

  currency: "USD",
  locale: "en-US",

  copyrightYear: new Date().getFullYear(),
} as const

export type SiteConfig = typeof siteConfig
