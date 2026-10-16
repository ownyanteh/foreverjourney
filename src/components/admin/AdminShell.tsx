'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  LayoutDashboard,
  Map,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Journeys', href: '/admin/journeys', icon: <Map className="h-4 w-4" /> },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  // Check session on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => {
        if (r.status === 401) {
          // Redirect to login unless already there
          if (!pathname.includes('/login')) {
            router.replace('/admin/login')
          } else {
            setIsLoggedIn(false)
          }
        } else {
          setIsLoggedIn(true)
        }
      })
      .catch(() => router.replace('/admin/login'))
  }, [pathname, router])

  // Login page — render without shell
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Still checking auth
  if (isLoggedIn === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-cream">
        <div className="animate-pulse text-burgundy">
          <Heart className="h-8 w-8" />
        </div>
      </div>
    )
  }

  if (!isLoggedIn) return null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <div className="min-h-dvh bg-cream flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-white/70 backdrop-blur-sm border-r border-blush-200 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-blush-200">
          <Heart className="h-5 w-5 text-burgundy fill-burgundy" />
          <span className="font-serif font-semibold text-burgundy text-lg">Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Admin navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                  ? 'bg-burgundy/10 text-burgundy'
                  : 'text-charcoal/70 hover:bg-blush-100 hover:text-charcoal'
              )}
            >
              {item.icon}
              {item.label}
              {(pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))) && (
                <ChevronRight className="h-3 w-3 ml-auto" />
              )}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-blush-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-charcoal/60 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-sm border-b border-blush-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-burgundy fill-burgundy" />
          <span className="font-serif font-semibold text-burgundy">Admin</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          className="p-2 rounded-lg hover:bg-blush-100"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-20" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <nav
            className="absolute top-14 left-0 right-0 bg-white border-b border-blush-200 px-3 py-3 space-y-1"
            onClick={(e) => e.stopPropagation()}
            aria-label="Mobile admin navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                    ? 'bg-burgundy/10 text-burgundy'
                    : 'text-charcoal/70 hover:bg-blush-100'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-charcoal/60 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0 min-h-dvh">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
