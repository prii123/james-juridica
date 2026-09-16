import {
  Home, Briefcase, Users, Scale, FileText, CreditCard, Settings,
  BarChart3, Calendar, Bot, MessageCircle, type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Home, Briefcase, Users, Scale, FileText, CreditCard, Settings,
  BarChart3, Calendar, Bot, MessageCircle,
}

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Home
}
