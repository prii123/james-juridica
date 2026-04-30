import {
  Home, Briefcase, Users, Scale, FileText, CreditCard, Settings,
  BarChart3, Calendar, type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Home, Briefcase, Users, Scale, FileText, CreditCard, Settings,
  BarChart3, Calendar,
}

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Home
}
