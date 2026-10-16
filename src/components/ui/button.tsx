'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none touch-manipulation',
  {
    variants: {
      variant: {
        default:
          'bg-burgundy text-white shadow hover:bg-burgundy-600 active:scale-95',
        secondary:
          'bg-blush-200 text-charcoal hover:bg-blush-300 border border-blush-300',
        outline:
          'border border-burgundy text-burgundy bg-transparent hover:bg-blush-100',
        ghost:
          'text-charcoal hover:bg-blush-100',
        gold:
          'bg-gold text-charcoal-400 shadow hover:bg-gold-500 active:scale-95 font-semibold',
        destructive:
          'bg-red-600 text-white hover:bg-red-700',
        romantic:
          'bg-gradient-to-r from-burgundy to-burgundy-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-semibold tracking-wide',
        'yes-button':
          'bg-gradient-to-r from-burgundy to-[#a03050] text-white text-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 py-6 px-10 rounded-2xl border-2 border-gold/30',
        'no-button':
          'bg-white/10 backdrop-blur-sm text-white/80 border border-white/20 hover:bg-white/20 text-base rounded-2xl',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-lg',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
