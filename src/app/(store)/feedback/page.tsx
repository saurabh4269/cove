"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function FeedbackPage() {
  const [text, setText] = useState("")
  const [phone, setPhone] = useState("")
  const [busy, setBusy] = useState(false)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      await fetch("/api/loop/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "voice",
          text: text.trim(),
          sentiment: "mixed",
          phone: phone.trim() || undefined,
          meta: { page: "feedback", phone: phone.trim() || undefined },
        }),
      })
      toast.success("Thanks — we got your message.")
      setText("")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          ← Cove
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Tell us what happened</h1>
      <p className="mt-2 text-muted-foreground">
        Orders, shipping, or checkout — we read every note. Leave a number if you want a callback.
      </p>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Your message</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={send} className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Checkout got stuck… package arrived late… wish you had Apple Pay…"
              rows={5}
              required
            />
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0100"
              />
            </div>
            <Button type="submit" disabled={busy || !text.trim()}>
              {busy ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
