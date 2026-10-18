'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, Mail, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Something went wrong. Please try again.')
        return
      }
      setSent(true)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-cream bg-[radial-gradient(70%_60%_at_50%_0%,#FCF0F3_0%,#FFF8F0_70%)] px-4 py-12 text-charcoal">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center mb-4" aria-label="Our Forever Journey home">
            <Heart className="h-[30px] w-[30px] text-burgundy fill-burgundy" strokeWidth={1.5} />
          </Link>
          <h1 className="font-serif text-[26px] font-semibold">Forgot your password?</h1>
          <p className="text-sm text-charcoal/60 mt-1">We&apos;ll email you a link to choose a new one.</p>
        </div>

        <div className="bg-white/85 backdrop-blur-sm rounded-[20px] border border-blush-200 shadow-[0_20px_50px_rgba(122,32,56,0.08)] p-6">
          {sent ? (
            <div className="text-center py-2" role="status">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <MailCheck className="h-6 w-6 text-emerald-700" />
              </div>
              <p className="font-medium">Check your inbox</p>
              <p className="text-sm text-charcoal/60 mt-1.5">
                If an account exists for <span className="font-medium text-charcoal">{email}</span>, a reset link is on its way. It expires in 1 hour.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">{error}</div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-[46px] rounded-xl border-blush-300 bg-white pl-[38px] pr-3.5 text-[15px] text-charcoal"
                  />
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                loading={sending}
                className="w-full h-12 rounded-xl bg-burgundy text-[15px] font-semibold shadow-none hover:bg-burgundy-600 active:scale-100"
              >
                Send reset link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-charcoal/60 mt-6">
          <Link href="/admin/login" className="font-medium text-burgundy hover:text-burgundy-600 underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
