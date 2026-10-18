'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import { signupSchema } from '@/lib/validation/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type SignupForm = z.infer<typeof signupSchema>

const inputClass = 'h-[46px] rounded-xl border-blush-300 bg-white pl-[38px] pr-3.5 text-[15px] text-charcoal'

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  async function onSubmit(data: SignupForm) {
    setServerError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setServerError(json.error || 'Sign-up failed. Please try again.')
        return
      }
      router.push('/admin')
    } catch {
      setServerError('Network error. Please check your connection.')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-cream bg-[radial-gradient(70%_60%_at_50%_0%,#FCF0F3_0%,#FFF8F0_70%)] px-4 py-12 text-charcoal">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center mb-4" aria-label="Our Forever Journey home">
            <Heart className="h-[30px] w-[30px] text-burgundy fill-burgundy" strokeWidth={1.5} />
          </Link>
          <h1 className="font-serif text-[26px] font-semibold text-charcoal">Create your account</h1>
          <p className="text-sm text-charcoal/60 mt-1">Plan a proposal she’ll never forget.</p>
        </div>

        <div className="bg-white/85 backdrop-blur-sm rounded-[20px] border border-blush-200 shadow-[0_20px_50px_rgba(122,32,56,0.08)] p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {serverError && (
              <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {serverError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Your first name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
                <Input id="name" autoComplete="given-name" placeholder="Kwame" className={inputClass} {...register('name')} />
              </div>
              {errors.name && <p className="text-xs text-red-600" role="alert">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" className={inputClass} {...register('email')} />
              </div>
              {errors.email && <p className="text-xs text-red-600" role="alert">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/40" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className={`${inputClass} pr-11`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-[38px] w-[38px] flex items-center justify-center rounded-[10px] text-charcoal/45 hover:text-charcoal/70 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600" role="alert">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-1 h-12 rounded-xl bg-burgundy text-[15px] font-semibold shadow-none hover:bg-burgundy-600 active:scale-100"
            >
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-charcoal/60 mt-6">
          Already have an account?{' '}
          <Link href="/admin/login" className="font-medium text-burgundy hover:text-burgundy-600 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
