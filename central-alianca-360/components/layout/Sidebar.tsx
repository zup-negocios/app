'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, ShoppingBag, Wrench,
  ClipboardCheck, AlertTriangle, GitMerge, Upload,
  Plug, Settings, ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/consultores', label: 'Consultores', icon: Users },
  { href: '/vendas', label: 'Vendas', icon: ShoppingBag },
  { href: '/montagens', label: 'Montagens', icon: Wrench },
  { href: '/checklist', label: 'Checklist', icon: ClipboardCheck },
  { href: '/pendencias', label: 'Pendências', icon: AlertTriangle, badge: true },
  { href: '/divergencias', label: 'Divergências', icon: GitMerge, badge: true },
  { href: '/importacoes', label: 'Importações', icon: Upload },
  { href: '/integracoes', label: 'Integrações', icon: Plug },
  { href: '/configuracoes', label: 'Configurações', icon: Settings, adminOnly: true },
]

interface SidebarProps {
  role: string
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 flex flex-col shrink-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Central Aliança</p>
          <p className="text-slate-400 text-xs">360°</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && role !== 'admin') return null
          const active = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon size={17} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <div className="px-3 py-2">
          <p className="text-slate-500 text-xs uppercase tracking-wider font-medium">
            {role}
          </p>
        </div>
      </div>
    </aside>
  )
}
