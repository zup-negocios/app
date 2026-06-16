import { clsx } from 'clsx'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'slate'
  trend?: { value: number; label: string }
  alert?: boolean
}

const colors = {
  blue: { bg: 'bg-blue-50', icon: 'bg-blue-100 text-blue-600', value: 'text-blue-700' },
  green: { bg: 'bg-green-50', icon: 'bg-green-100 text-green-600', value: 'text-green-700' },
  red: { bg: 'bg-red-50', icon: 'bg-red-100 text-red-600', value: 'text-red-700' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600', value: 'text-yellow-700' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', value: 'text-purple-700' },
  slate: { bg: 'bg-slate-50', icon: 'bg-slate-100 text-slate-600', value: 'text-slate-700' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', alert }: StatCardProps) {
  const c = colors[color]

  return (
    <div className={clsx('stat-card relative', alert && 'ring-2 ring-red-300')}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{title}</p>
          <p className={clsx('text-3xl font-bold mt-1', c.value)}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ml-3', c.icon)}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  )
}
