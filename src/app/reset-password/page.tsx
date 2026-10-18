'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Heart, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const inputClass = 'h-[46px] rounded-xl border-blush-300 bg-white pl-[38px] pr-11 text-[15px] text-charcoal'

function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Could not reset your password. Please try again.')
        return
      }
      setDone(true)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setSaving(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center py-2">
        <p className="font-medium">This reset link is incomplete</p>
        <p className="text-sm text-charcoal/60 mt-1.5">Open the link from your email again, or request a new one.</p>
        <Link href="/forgot-password" className="inline-block mt-4 text-sm font-medium text-burgundy hover:underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center py-2" role="status">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-700" />
        </div>
        <p className="font-medium">Your password has been changed</p>
        <p className="text-sm text-charcoal/60 mt-1.5">You can now sign in with your new password.</p>
        <Button asChild className="mt-5 w-full h-12 rounded-xl bg-burgundy text-[15px] font-semibold shadow-none hover:bg-burgundy-600 active:scale-100">
          <Link href="/admin/login">Sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          {error}
          {error.includes('expired') && (
            <>
              {' '}
              <Link href="/forgot-password" className="font-medium underline underline-offset-2">Request a new link</Link>
            </>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium">New password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
          <Input
            id="password"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-[38px] w-[38px] flex items-center justify-center rounded-[10px] text-charcoal/45 hover:text-charcoal/70"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm" className="text-sm font-medium">Confirm new password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
          <Input
            id="confirm"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <Button
        type="submit"
        size="lg"
        loading={saving}
        className="w-full h-12 rounded-xl bg-burgundy text-[15px] font-semibold shadow-none hover:bg-burgundy-600 active:scale-100"
      >
        Save new password
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-cream bg-[radial-gradient(70%_60%_at_50%_0%,#FCF0F3_0%,#FFF8F0_70%)] px-4 py-12 text-charcoal">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center mb-4" aria-label="Our Forever Journey home">
            <Heart className="h-[30px] w-[30px] text-burgundy fill-burgundy" strokeWidth={1.5} />
          </Link>
          <h1 className="font-serif text-[26px] font-semibold">Choose a new password</h1>
        </div>
        <div className="bg-white/85 backdrop-blur-sm rounded-[20px] border border-blush-200 shadow-[0_20px_50px_rgba(122,32,56,0.08)] p-6">
          <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-blush-100" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
