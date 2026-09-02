import type { ProductImage } from "@/types"

/** Same line item as e2e-checkout.mjs (organic-cotton-tshirt, default variant). */
export const DEMO_CHECKOUT_LINE_ITEM = {
  variantId: "var-3-1",
  productId: "prod-3",
  name: "Organic Cotton T-Shirt",
  variantName: "White / S",
  slug: "organic-cotton-tshirt",
  price: 2999,
  quantity: 1,
  image: {
    url: "/images/products/placeholder.svg",
    alt: "Cotton t-shirt front",
    width: 800,
    height: 800,
  } satisfies ProductImage,
} as const
