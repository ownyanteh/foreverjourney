/**
 * Shared admin-only class strings so every admin screen matches the design
 * mockups without touching the shared primitives in src/components/ui.
 * Pass these via className to Card / Button / Input / Badge etc.
 */

/** White card, blush border, 18px radius, very soft shadow. */
export const adminCard =
  'rounded-[18px] border border-blush-200 bg-white backdrop-blur-none shadow-[0_1px_2px_rgba(36,33,38,0.04)]'

/** Card header wrapper: padding + light divider below. */
export const adminCardHeader = 'flex flex-col gap-1 px-6 py-[18px] border-b border-blush-100'

/** Card header title: serif 18px. */
export const adminCardTitle = 'font-serif text-lg font-semibold text-charcoal'

/** Card header description under the title. */
export const adminCardDesc = 'text-[13px] text-charcoal/55'

/** Card body padding (below a header). */
export const adminCardBody = 'px-6 py-5'

/** 44px text input. */
export const adminInput =
  'h-11 rounded-xl border-blush-300 bg-white px-3.5 text-[15px] text-charcoal placeholder:text-charcoal/40'

/** Textarea matching the inputs. */
export const adminTextarea =
  'rounded-xl border-blush-300 bg-white px-3.5 py-2.5 text-[15px] leading-relaxed text-charcoal placeholder:text-charcoal/40'

/** 14px medium label. */
export const adminLabel = 'text-sm font-medium text-charcoal'

/** Field hint text. */
export const adminHint = 'text-xs text-charcoal/45'

/** Primary burgundy button (42px). */
export const adminBtnPrimary =
  'h-[42px] px-[18px] rounded-xl bg-burgundy text-white text-sm font-semibold shadow-none hover:bg-burgundy-600 active:scale-100'

/** Outline button (42px) with blush border. */
export const adminBtnOutline =
  'h-[42px] px-[18px] rounded-xl border border-blush-300 bg-white text-charcoal text-sm font-medium hover:bg-blush-100 hover:text-charcoal'

/** Small outline button (36px) used for list "Manage" actions. */
export const adminBtnOutlineSm =
  'h-9 px-3.5 rounded-[10px] border border-blush-300 bg-white text-charcoal text-[13px] font-medium hover:bg-blush-100 hover:text-charcoal'

/** 36px ghost back button in page headers. */
export const adminBackBtn =
  'h-9 w-9 p-0 rounded-[10px] text-charcoal hover:bg-blush-100 flex-shrink-0'

/** Page header title (sub pages). */
export const adminPageTitle = 'font-serif text-[26px] sm:text-[28px] font-semibold text-charcoal leading-tight'

/** Page header title (dashboard / journeys list). */
export const adminPageTitleLg = 'font-serif text-[30px] sm:text-[34px] font-semibold text-charcoal leading-tight'

/** Page header subtitle. */
export const adminPageSubtitle = 'text-sm text-charcoal/60 mt-0.5'

/** Base badge pill. */
export const adminBadge = 'h-[22px] px-2.5 py-0 rounded-full text-xs font-semibold'

/** Status badge colors. */
export const statusBadgeClass: Record<string, string> = {
  draft: 'bg-[#EEECEF] text-charcoal/70',
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-gold/[0.22] text-[#8A6A24]',
  deactivated: 'bg-[#F4F1F2] text-charcoal/55',
}

/** YES response badge. */
export const yesBadgeClass = 'bg-amber-100 text-[#8A6A24]'

/** "No" response badge. */
export const noBadgeClass = 'bg-blush-100 text-charcoal/70'

/** Error alert box. */
export const adminAlertError =
  'text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5'
