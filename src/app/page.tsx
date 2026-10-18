import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart, Map, MessageCircleHeart, Camera, Link as LinkIcon, Activity, Sparkle, ChevronRight } from 'lucide-react'
import { getAdminSession } from '@/lib/auth/session'

export const metadata: Metadata = {
  title: 'Our Forever Journey: plan an unforgettable proposal',
  description:
    'Create a private, personal journey for your partner, through the places or the memories you share, that ends with the question: Will you marry me?',
  // The landing page is public; journeys and the dashboard stay unindexed
  robots: { index: true, follow: true },
}

const steps = [
  {
    title: 'Create your journey',
    body: 'Sign up, then choose how she’ll get to the big moment: a route through your special places, or questions about your memories together.',
  },
  {
    title: 'Make it yours',
    body: 'Write the welcome, your memories or checkpoints, and the message she reads right before the question.',
  },
  {
    title: 'Send her the link',
    body: 'She opens a private link on her phone, goes through the journey, and the proposal appears at the end.',
  },
]

const features = [
  { icon: Camera, title: 'Capture the moment', body: 'After she says yes, she can take selfies and share photos and messages with you.' },
  { icon: LinkIcon, title: 'Private by design', body: 'Only someone with your unique link can open the journey, and you can revoke it any time.' },
  { icon: Activity, title: 'Follow along', body: 'See her progress, her answers and her response from your dashboard.' },
]

export default async function HomePage() {
  const session = await getAdminSession()
  const signedIn = Boolean(session.isLoggedIn)

  return (
    <div className="min-h-dvh bg-cream text-charcoal">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#9A2E4B_0%,#7A2038_38%,#4A1322_72%,#242126_100%)] text-white">
        <Heart aria-hidden="true" className="absolute left-[8%] top-28 h-6 w-6 fill-blush text-blush opacity-20" />
        <Sparkle aria-hidden="true" className="absolute right-[12%] top-40 h-4 w-4 fill-gold text-gold opacity-40" />
        <Heart aria-hidden="true" className="absolute right-[6%] bottom-24 h-5 w-5 fill-blush text-blush opacity-15" />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 py-5">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-5 w-5 fill-white text-white" />
            <span className="font-serif text-lg font-semibold">Our Forever Journey</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Account">
            {signedIn ? (
              <Link href="/admin" className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-burgundy hover:bg-cream">
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link href="/admin/login" className="hidden sm:inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-white/85 hover:text-white">
                  Sign in
                </Link>
                <Link href="/signup" className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-semibold text-burgundy hover:bg-cream">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 pt-10 pb-20 sm:pt-16 sm:pb-28 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="text-center lg:text-left">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">A proposal she’ll never forget</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-semibold leading-[1.08]">
              Every moment you’ve shared, leading to one question.
            </h1>
            <p className="mx-auto lg:mx-0 mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/75">
              Create a private journey for your partner, through the places that matter to you or the memories you share, that ends with “Will you marry me?”
            </p>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link
                href={signedIn ? '/admin' : '/signup'}
                className="inline-flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-[18px] bg-white px-8 text-base font-semibold text-burgundy shadow-[0_18px_40px_rgba(26,6,12,0.35)] hover:bg-cream"
              >
                <Heart className="h-5 w-5 fill-burgundy text-burgundy" />
                {signedIn ? 'Go to dashboard' : 'Start planning'}
              </Link>
              {!signedIn && (
                <Link href="/admin/login" className="inline-flex h-14 items-center px-4 text-sm font-medium text-white/80 hover:text-white">
                  I already have an account
                </Link>
              )}
            </div>
          </div>

          {/* Proposal preview */}
          <div className="mx-auto w-full max-w-[300px]" aria-hidden="true">
            <div className="rounded-[36px] border border-white/15 bg-[radial-gradient(110%_70%_at_50%_30%,#62192D_0%,#320C17_60%,#1A060C_100%)] p-6 pt-10 text-center shadow-[0_40px_80px_rgba(0,0,0,0.4)]">
              <p className="font-serif text-lg text-white/85">You made it, my love.</p>
              <div className="mx-auto my-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-gradient-to-br from-burgundy-200 to-gold-200">
                <Heart className="h-8 w-8 fill-burgundy text-burgundy" />
              </div>
              <p className="font-serif text-[28px] font-bold leading-tight text-white">Will you marry me?</p>
              <div className="mt-6 rounded-2xl bg-gradient-to-b from-gold-300 to-gold py-3.5 text-base font-bold text-[#320C17] shadow-[0_0_0_6px_rgba(216,180,106,0.18)]">
                YES! ❤️
              </div>
              <p className="mt-3 pb-2 text-sm text-white/55">No</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <h2 className="text-center font-serif text-3xl sm:text-4xl font-semibold">How it works</h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-[20px] border border-blush-200 bg-white p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-burgundy text-sm font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 font-serif text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-charcoal/65">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Two ways */}
      <section className="bg-blush-100/60 border-y border-blush-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <h2 className="text-center font-serif text-3xl sm:text-4xl font-semibold">Two ways to get to “yes”</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-charcoal/60">Pick the one that fits your story. You can switch any time before you send the link.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="rounded-[22px] border border-blush-200 bg-white p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-burgundy/10">
                <Map className="h-6 w-6 text-burgundy" />
              </div>
              <h3 className="mt-5 font-serif text-2xl font-semibold">Route &amp; destination</h3>
              <p className="mt-2 leading-relaxed text-charcoal/65">
                She follows a live map through the places that matter to you. Each stop unlocks a message, photo or voice note, until she reaches the final destination, where you’re waiting.
              </p>
            </div>
            <div className="rounded-[22px] border border-blush-200 bg-white p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-burgundy/10">
                <MessageCircleHeart className="h-6 w-6 text-burgundy" />
              </div>
              <h3 className="mt-5 font-serif text-2xl font-semibold">Memory questions</h3>
              <p className="mt-2 leading-relaxed text-charcoal/65">
                No travel needed. She answers 3–5 questions about moments you’ve shared and tells you how each one made her feel. Then the question appears.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="h-6 w-6 text-burgundy" />
              <h3 className="mt-3 font-serif text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-charcoal/65">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="mx-auto max-w-4xl rounded-[28px] bg-[linear-gradient(150deg,#7A2038_0%,#5E1A2D_55%,#242126_100%)] px-6 py-14 text-center text-white">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold">Ready to plan your moment?</h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">It takes a few minutes to set up. She’ll remember it forever.</p>
          <Link
            href={signedIn ? '/admin' : '/signup'}
            className="mt-8 inline-flex h-14 items-center justify-center gap-1.5 rounded-[18px] bg-white px-8 text-base font-semibold text-burgundy hover:bg-cream"
          >
            {signedIn ? 'Go to dashboard' : 'Create your journey'}
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-blush-200 py-8 text-center text-sm text-charcoal/45">
        <span className="inline-flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5 fill-burgundy text-burgundy" /> Our Forever Journey
        </span>
      </footer>
    </div>
  )
}
