import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Spinner({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <div className="flex items-center justify-center py-10" role="status">
      <Loader2 size={size} className={cn('animate-spin text-blue-800', className)} />
      <span className="sr-only">Cargando...</span>
    </div>
  )
}
