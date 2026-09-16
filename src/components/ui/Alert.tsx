import { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const alertVariants = cva('flex items-start gap-2 rounded-lg border px-4 py-3 text-sm', {
  variants: {
    variant: {
      danger: 'border-red-200 bg-red-50 text-red-800',
      success: 'border-teal-200 bg-teal-50 text-teal-800',
      warning: 'border-amber-200 bg-amber-50 text-amber-800',
      info: 'border-sky-200 bg-sky-50 text-sky-800',
    },
  },
  defaultVariants: { variant: 'info' },
})

const icons = {
  danger: XCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
}

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string
}

export default function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
  const Icon = icons[variant ?? 'info']
  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
