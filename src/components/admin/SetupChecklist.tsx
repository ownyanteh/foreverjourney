import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEFAULT_ROUTE_INTRO, DEFAULT_QUESTIONS_INTRO, DEFAULT_PROPOSAL_MESSAGE } from '@/lib/journey-defaults'
import { MIN_MEMORY_QUESTIONS } from '@/lib/validation/schemas'

interface ChecklistJourney {
  _id: string
  mode: 'route' | 'questions'
  status: string
  welcomeIntroduction: string
  questionCount: number
  hasFinalDestination: boolean
  checkpointCount: number
  proposalMessage: string
  hasInvitation: boolean
}

interface Step {
  label: string
  hint: string
  done: boolean
  href: string
  optional?: boolean
}

/**
 * Guides a first-time user through setting up a journey. Each step's "done"
 * state is derived from the journey itself. Hidden once everything is done.
 */
export default function SetupChecklist({ journey }: { journey: ChecklistJourney }) {
  const base = `/admin/journeys/${journey._id}`
  const isQuestions = journey.mode === 'questions'
  const isLive = journey.status === 'active' || journey.status === 'completed'

  const steps: Step[] = [
    {
      label: 'Personalise the welcome message',
      hint: 'The first thing she reads when she opens your link.',
      done: ![DEFAULT_ROUTE_INTRO, DEFAULT_QUESTIONS_INTRO, ''].includes(journey.welcomeIntroduction.trim()),
      href: `${base}/edit`,
      optional: true,
    },
    ...(isQuestions
      ? [
          {
            label: `Write ${MIN_MEMORY_QUESTIONS}–5 memory questions`,
            hint: 'Moments you’ve shared. She tells you how each one made her feel.',
            done: journey.questionCount >= MIN_MEMORY_QUESTIONS,
            href: `${base}/questions`,
          },
        ]
      : [
          {
            label: 'Set the final destination',
            hint: 'Where she ends up and the proposal appears.',
            done: journey.hasFinalDestination,
            href: `${base}/proposal`,
          },
          {
            label: 'Add checkpoints along the way',
            hint: 'Stops that unlock messages, photos or voice notes.',
            done: journey.checkpointCount > 0,
            href: `${base}/checkpoints`,
            optional: true,
          },
        ]),
    {
      label: 'Write your proposal message',
      hint: 'What she reads right before the big question.',
      done: journey.proposalMessage.trim() !== '' && journey.proposalMessage.trim() !== DEFAULT_PROPOSAL_MESSAGE,
      href: `${base}/proposal`,
    },
    {
      label: 'Activate the journey',
      hint: 'Use the Activate Journey button above when you’re ready.',
      done: isLive,
      href: base,
    },
    {
      label: 'Send her the invitation link',
      hint: 'Generate a private link and send it by text or email.',
      done: journey.hasInvitation,
      href: `${base}/invitation`,
    },
  ]

  const required = steps.filter((s) => !s.optional)
  const doneCount = steps.filter((s) => s.done).length
  if (required.every((s) => s.done)) return null

  const nextIndex = steps.findIndex((s) => !s.done && !s.optional)

  return (
    <section className="rounded-[18px] border border-blush-200 bg-white shadow-[0_1px_2px_rgba(36,33,38,0.04)]" aria-labelledby="setup-title">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-[18px] border-b border-blush-100">
        <div>
          <h2 id="setup-title" className="font-serif text-lg font-semibold text-charcoal">Get your journey ready</h2>
          <p className="text-[13px] text-charcoal/55 mt-0.5">{doneCount} of {steps.length} steps done</p>
        </div>
        <div className="w-full sm:w-40 h-1.5 rounded-full bg-blush-100 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-burgundy rounded-full transition-all" style={{ width: `${Math.round((doneCount / steps.length) * 100)}%` }} />
        </div>
      </div>
      <ol className="divide-y divide-blush-100">
        {steps.map((step, i) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className={cn(
                'flex items-center gap-3.5 px-6 py-3.5 transition-colors hover:bg-blush-100/60',
                i === nextIndex && 'bg-burgundy/[0.04]'
              )}
            >
              <span
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold',
                  step.done ? 'bg-emerald-100 text-emerald-700' : i === nextIndex ? 'bg-burgundy text-white' : 'bg-blush-100 text-charcoal/45'
                )}
              >
                {step.done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className={cn('block text-sm font-medium', step.done ? 'text-charcoal/50 line-through decoration-charcoal/25' : 'text-charcoal')}>
                  {step.label}
                  {step.optional && <span className="ml-1.5 text-xs font-normal text-charcoal/40 no-underline">(optional)</span>}
                </span>
                {!step.done && <span className="block text-xs text-charcoal/50 mt-0.5">{step.hint}</span>}
              </span>
              {!step.done && <ChevronRight className="h-4 w-4 text-charcoal/30 flex-shrink-0" />}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
