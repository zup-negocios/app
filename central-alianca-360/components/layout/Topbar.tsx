'use client'

import { signOut } from 'next-auth/react'
import { LogOut, Bell } from 'lucide-react'

interface TopbarProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

export default function Topbar({ user }: TopbarProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm text-slate-500">
          Aliança Móveis — Sistema de Gestão
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-400">{user.role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
