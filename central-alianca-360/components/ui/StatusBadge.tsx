import { clsx } from 'clsx'

const statusConfig: Record<string, { label: string; classes: string }> = {
  aprovada: { label: 'Aprovada', classes: 'bg-green-100 text-green-700' },
  concluida: { label: 'Concluída', classes: 'bg-green-100 text-green-700' },
  realizada: { label: 'Realizada', classes: 'bg-green-100 text-green-700' },
  agendada: { label: 'Agendada', classes: 'bg-blue-100 text-blue-700' },
  pendente: { label: 'Pendente', classes: 'bg-yellow-100 text-yellow-700' },
  cancelada: { label: 'Cancelada', classes: 'bg-red-100 text-red-700' },
  atrasada: { label: 'Atrasada', classes: 'bg-red-100 text-red-700' },
  reagendada: { label: 'Reagendada', classes: 'bg-orange-100 text-orange-700' },
  confirmado: { label: 'Confirmado', classes: 'bg-green-100 text-green-700' },
  rejeitado: { label: 'Rejeitado', classes: 'bg-red-100 text-red-700' },
  ignorado: { label: 'Ignorado', classes: 'bg-slate-100 text-slate-600' },
  consultor_externo: { label: 'Cons. Externo', classes: 'bg-purple-100 text-purple-700' },
  checklist: { label: 'Checklist', classes: 'bg-teal-100 text-teal-700' },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status?.toLowerCase()] || {
    label: status || '—',
    classes: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={clsx('badge', config.classes)}>
      {config.label}
    </span>
  )
}
