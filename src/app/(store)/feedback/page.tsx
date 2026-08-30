"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function FeedbackPage() {
  const [text, setText] = useState("")
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
          meta: { page: "feedback" },
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
        Orders, shipping, or checkout — we read every note.
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
            <Button type="submit" disabled={busy || !text.trim()}>
              {busy ? "Sending…" : "Send feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
