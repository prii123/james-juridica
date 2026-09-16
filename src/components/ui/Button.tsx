import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
  {
    variants: {
      variant: {
        primary: 'bg-blue-800 text-white shadow-soft hover:bg-blue-900 hover:shadow-soft-md focus-visible:ring-blue-800',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400',
        success: 'bg-teal-700 text-white shadow-soft hover:bg-teal-800 hover:shadow-soft-md focus-visible:ring-teal-700',
        danger: 'bg-red-600 text-white shadow-soft hover:bg-red-700 hover:shadow-soft-md focus-visible:ring-red-600',
        outline: 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400',
        outlinePrimary: 'border border-blue-200 bg-white text-blue-800 hover:border-blue-300 hover:bg-blue-50 focus-visible:ring-blue-800',
        outlineDanger: 'border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 focus-visible:ring-red-600',
        ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
        link: 'h-auto p-0 text-blue-800 underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export default Button
