import { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      variant: {
        primary: 'bg-blue-50 text-blue-700 ring-blue-700/15',
        secondary: 'bg-slate-100 text-slate-600 ring-slate-600/10',
        success: 'bg-teal-50 text-teal-700 ring-teal-700/15',
        danger: 'bg-red-50 text-red-700 ring-red-700/15',
        warning: 'bg-amber-50 text-amber-700 ring-amber-700/15',
        info: 'bg-sky-50 text-sky-700 ring-sky-700/15',
        outline: 'bg-white text-slate-600 ring-slate-200',
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
