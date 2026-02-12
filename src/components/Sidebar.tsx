'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Briefcase, 
  Users,
  Scale,
  FileText,
  CreditCard,
  Phone,
  Settings,
  BarChart3
} from 'lucide-react'

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    description: 'Vista general y métricas'
  },
  { 
    name: 'Casos', 
    href: '/casos', 
    icon: Briefcase,
    description: 'Gestión de casos de insolvencia'
  },
  { 
    name: 'Leads', 
    href: '/leads', 
    icon: Users,
    description: 'Potenciales clientes'
  },
  { 
    name: 'Asesorías', 
    href: '/asesorias', 
    icon: Scale,
    description: 'Consultas y asesorías jurídicas'
  },
  { 
    name: 'Conciliaciones', 
    href: '/conciliaciones', 
    icon: FileText,
    description: 'Procesos de conciliación'
  },
  { 
    name: 'Cartera', 
    href: '/cartera', 
    icon: CreditCard,
    description: 'Gestión de cobros y pagos'
  },
  { 
    name: 'Facturación', 
    href: '/facturacion', 
    icon: BarChart3,
    description: 'Facturación y reportes financieros'
  },
  { 
    name: 'Usuarios', 
    href: '/usuarios', 
    icon: Users,
    description: 'Gestión de usuarios y permisos'
  }
]

interface SidebarProps {
  className?: string
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname()
  
  return (
    <div className={`bg-white shadow-sm border-r border-slate-200 h-full ${className}`}>
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <h2 className="text-xl font-bold text-slate-900">ERP Jurídico</h2>
        <p className="text-sm text-slate-600 font-medium">Procesos de Insolvencia</p>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-4 border-blue-600 shadow-sm' 
                  : 'text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:text-slate-900 hover:shadow-sm'
                }
              `}
            >
              <Icon 
                className={`h-5 w-5 transition-colors duration-200 ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-slate-500 hidden lg:block truncate">
                  {item.description}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>
      
      <div className="mt-auto p-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <Link
          href="/configuracion"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 hover:text-slate-900 transition-all duration-200 group"
        >
          <Settings className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors duration-200" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Configuración</div>
            <div className="text-xs text-slate-500 hidden lg:block truncate">
              Ajustes del sistema
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}