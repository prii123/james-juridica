import { HTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  onClose: () => void
  title: ReactNode
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg' | 'xl'
}

const sizes = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ onClose, title, icon, children, footer, size = 'md' }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-[1050] flex animate-fade-in items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className={cn('w-full animate-scale-in rounded-2xl bg-white shadow-soft-xl', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <h5 className="m-0 flex items-center gap-2 text-base font-semibold tracking-tight text-slate-800">
            {icon}
            {title}
          </h5>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function ModalBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />
}
