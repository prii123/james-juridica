import {
  Home, Briefcase, Users, Scale, FileText, CreditCard, Settings,
  BarChart3, Calendar, Bot, MessageCircle, UserCheck, type LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  Home, Briefcase, Users, Scale, FileText, CreditCard, Settings,
  BarChart3, Calendar, Bot, MessageCircle, UserCheck,
}

export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Home
}
