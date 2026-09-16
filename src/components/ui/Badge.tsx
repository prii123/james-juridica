import { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-blue-100 text-blue-800',
        secondary: 'bg-slate-100 text-slate-700',
        success: 'bg-teal-100 text-teal-800',
        danger: 'bg-red-100 text-red-700',
        warning: 'bg-amber-100 text-amber-800',
        info: 'bg-sky-100 text-sky-800',
        outline: 'border border-slate-300 text-slate-600',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  }
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export default function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
