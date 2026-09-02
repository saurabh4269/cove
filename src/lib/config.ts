// Store Configuration — Cove (Product Y for Product OS)

export const siteConfig = {
  name: "Cove",
  tagline: "Everyday goods, carefully made.",
  description: "Everyday goods for home and work — carefully made, shipped fast.",

  announcement: "Free shipping on orders over $75.",

  url: process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000",

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
