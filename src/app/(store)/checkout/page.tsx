"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCartStore } from "@/store/cart"
import { useOrdersStore } from "@/store/orders"
import { CartSummary } from "@/components/cart/cart-summary"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"
import { siteConfig } from "@/lib/config"
import type { Order } from "@/types"
import { events as analytics } from "@/lib/analytics"
import { DEMO_CHECKOUT_LINE_ITEM } from "@/lib/cart/demo-line-item"

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

function formatCardNumber(value: string) {
  const digits = onlyDigits(value).slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

function formatExpiry(value: string) {
  const digits = onlyDigits(value).slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function deliveryWindowLabel() {
  const start = new Date()
  start.setDate(start.getDate() + 2)
  const end = new Date()
  end.setDate(end.getDate() + 4)
  const fmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

/** Pre-filled shopper for faster checkout repro during incidents. */
const CHECKOUT_PREFILL = {
  form: {
    email: "alex.chen@cove.shop",
    firstName: "Alex",
    lastName: "Chen",
    line1: "742 Evergreen Terrace",
    line2: "Apt 4B",
    city: "San Francisco",
    state: "CA",
    postalCode: "94107",
    country: "US",
  },
  pay: {
    name: "Alex Chen",
    number: "4242 4242 4242 4242",
    expiry: "12/28",
    cvc: "123",
  },
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const clearCart = useCartStore((s) => s.clearCart)
  const addOrder = useOrdersStore((s) => s.addOrder)
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ ...CHECKOUT_PREFILL.form })

  const [pay, setPay] = useState({ ...CHECKOUT_PREFILL.pay })

  const [sdk, setSdk] = useState("4.3.0")
  const [hung, setHung] = useState(false)
  const [flagsLoaded, setFlagsLoaded] = useState(false)
  const [showDelivery, setShowDelivery] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    fetch("/api/loop/flags")
      .then((r) => r.json())
      .then((d) => {
        setSdk(String(d.sdk || "4.3.0"))
        setHung(Boolean(d.hung))
        setShowDelivery(d.flags?.show_delivery_date_earlier === "on")
      })
      .catch(() => undefined)
      .finally(() => setFlagsLoaded(true))
  }, [])

  useEffect(() => {
    if (!mounted || !flagsLoaded || !hung || items.length > 0) return
    addItem(DEMO_CHECKOUT_LINE_ITEM)
  }, [mounted, flagsLoaded, hung, items.length, addItem])

  useEffect(() => {
    if (!mounted || items.length === 0) return
    const subtotal = getSubtotal()
    analytics.beginCheckout(subtotal, items.length)
  }, [mounted, items.length, getSubtotal])

  const seedingDemoCart = hung && flagsLoaded && items.length === 0

  if (!mounted || !flagsLoaded || seedingDemoCart) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Your cart is empty. Add some products before checking out.
          </p>
          <Button className="mt-8" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handlePayChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    if (name === "number") {
      setPay((p) => ({ ...p, number: formatCardNumber(value) }))
      return
    }
    if (name === "expiry") {
      setPay((p) => ({ ...p, expiry: formatExpiry(value) }))
      return
    }
    if (name === "cvc") {
      setPay((p) => ({ ...p, cvc: onlyDigits(value).slice(0, 4) }))
      return
    }
    setPay((p) => ({ ...p, [name]: value }))
  }

  function cardLooksValid() {
    const digits = onlyDigits(pay.number)
    const exp = onlyDigits(pay.expiry)
    return (
      pay.name.trim().length >= 2 &&
      digits.length >= 15 &&
      exp.length === 4 &&
      pay.cvc.length >= 3
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.email || !form.firstName || !form.lastName || !form.line1 || !form.city || !form.state || !form.postalCode) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!cardLooksValid()) {
      toast.error("Please check your card details")
      return
    }

    setLoading(true)
    analytics.addPaymentInfo(subtotal)

    // Flag-driven authorize hang (invisible to shoppers; signal still goes to Product OS).
    if (hung) {
      // Product OS: Safari 3DS — fail fast instead of hanging shoppers
      await new Promise((r) => setTimeout(r, 800))
      void fetch("/api/loop/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "signal",
          source: "cove.checkout",
          polarity: "negative",
          domain: "technical",
          metric: "checkout_conversion",
          delta: -0.22,
          baseline: 0.72,
          title: "Checkout hung on payment SDK",
          dimensions: { sdk, flow: "checkout", browser: "Safari", error: "3ds_hang" },
        }),
      })
      setLoading(false)
      toast.error("Payment authorization timed out. Please try again in a moment.")
      return
    }

    const shipping = subtotal >= siteConfig.freeShippingThreshold ? 0 : 599
    const tax = Math.round(subtotal * siteConfig.taxRate)
    const total = subtotal + shipping + tax
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`

    const order: Order = {
      id: orderId,
      orderNumber: orderId,
      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        variantName: item.variantName,
        sku: "",
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        total: item.lineTotal,
      })),
      status: "processing",
      paymentStatus: "captured",
      subtotal,
      tax,
      shipping,
      total,
      currency: "USD",
      shippingAddress: {
        id: "addr-1",
        type: "shipping",
        firstName: form.firstName,
        lastName: form.lastName,
        line1: form.line1,
        line2: form.line2 || undefined,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
        isDefault: true,
      },
      customerEmail: form.email,
      customerName: `${form.firstName} ${form.lastName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addOrder(order)
    clearCart()
    analytics.purchase(orderId, total)
    void fetch("/api/loop/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "signal",
        source: "cove.checkout",
        polarity: "positive",
        domain: "funnel",
        metric: "purchase",
        title: "Order placed",
        dimensions: { sdk, orderId },
      }),
    })
    toast.success("Order placed")
    router.push(`/checkout/success?order_id=${orderId}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    autoComplete="family-name"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="line1">Address</Label>
                <Input
                  id="line1"
                  name="line1"
                  autoComplete="address-line1"
                  value={form.line1}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="line2">Apartment, suite, etc. (optional)</Label>
                <Input
                  id="line2"
                  name="line2"
                  autoComplete="address-line2"
                  value={form.line2}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" autoComplete="address-level2" value={form.city} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" autoComplete="address-level1" value={form.state} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">ZIP</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    autoComplete="postal-code"
                    value={form.postalCode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              {showDelivery ? (
                <p className="text-sm text-muted-foreground">Estimated delivery {deliveryWindowLabel()}.</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="rounded border px-2 py-1">Visa</span>
                <span className="rounded border px-2 py-1">Mastercard</span>
                <span className="rounded border px-2 py-1">Amex</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardName">Name on card</Label>
                <Input
                  id="cardName"
                  name="name"
                  autoComplete="cc-name"
                  value={pay.name}
                  onChange={handlePayChange}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card number</Label>
                <Input
                  id="cardNumber"
                  name="number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={pay.number}
                  onChange={handlePayChange}
                  placeholder="4242 4242 4242 4242"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cardExpiry">Expiry</Label>
                  <Input
                    id="cardExpiry"
                    name="expiry"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={pay.expiry}
                    onChange={handlePayChange}
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardCvc">CVC</Label>
                  <Input
                    id="cardCvc"
                    name="cvc"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={pay.cvc}
                    onChange={handlePayChange}
                    placeholder="123"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} &times; {item.quantity}
                  </span>
                  <span>{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
              <Separator />
              <CartSummary subtotal={subtotal} />
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Authorizing…" : "Pay now"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
