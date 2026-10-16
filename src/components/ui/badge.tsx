import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-burgundy/10 text-burgundy',
        secondary: 'bg-blush-200 text-charcoal',
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        destructive: 'bg-red-100 text-red-800',
        gold: 'bg-gold/20 text-gold-500',
        outline: 'border border-burgundy/30 text-burgundy bg-transparent',
        draft: 'bg-gray-100 text-gray-600',
        active: 'bg-emerald-100 text-emerald-700',
        completed: 'bg-gold/20 text-gold-500',
        deactivated: 'bg-gray-100 text-gray-500',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
