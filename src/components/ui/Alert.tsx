import { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export const alertVariants = cva('flex items-start gap-2.5 rounded-xl border-l-4 px-4 py-3.5 text-sm', {
  variants: {
    variant: {
      danger: 'border-red-500 bg-red-50 text-red-800',
      success: 'border-teal-600 bg-teal-50 text-teal-800',
      warning: 'border-amber-500 bg-amber-50 text-amber-800',
      info: 'border-sky-500 bg-sky-50 text-sky-800',
    },
  },
  defaultVariants: { variant: 'info' },
})

const iconStyles = {
  danger: { Icon: XCircle, color: 'text-red-600' },
  success: { Icon: CheckCircle2, color: 'text-teal-600' },
  warning: { Icon: AlertTriangle, color: 'text-amber-600' },
  info: { Icon: Info, color: 'text-sky-600' },
}

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string
}

export default function Alert({ className, variant = 'info', title, children, ...props }: AlertProps) {
  const { Icon, color } = iconStyles[variant ?? 'info']
  return (
    <div className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
      <Icon size={18} className={cn('mt-0.5 shrink-0', color)} />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}
