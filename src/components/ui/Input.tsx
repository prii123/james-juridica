import {
  InputHTMLAttributes,
  forwardRef,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  HTMLAttributes,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const fieldBase =
  'block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 disabled:bg-slate-50 disabled:text-slate-400 disabled:hover:border-slate-200'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldBase, className)} {...props} />
  )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(fieldBase, className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, multiple, size, children, ...props }, ref) => {
    // El chevron personalizado no aplica a listas multi-línea (size > 1 o multiple).
    const isListbox = multiple || (typeof size === 'number' && size > 1)
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          multiple={multiple}
          size={size}
          className={cn(fieldBase, !isListbox && 'appearance-none pr-9', className)}
          {...props}
        >
          {children}
        </select>
        {!isListbox && (
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-slate-700', className)} {...props} />
}

export function FormHelp({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1.5 text-xs text-slate-500', className)} {...props} />
}
