import { prisma } from '@/lib/prisma'
import { formatarData } from '@/lib/dates'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import { ClipboardCheck, AlertTriangle } from 'lucide-react'

export default async function ChecklistPage() {
  const checklists = await prisma.checklist.findMany({
    include: {
      consultor: { select: { nome: true } },
    },
    orderBy: { dataChecklist: 'desc' },
  })

  const pendentes = checklists.filter((c) => c.pendente).length
  const concluidos = checklists.filter((c) => !c.pendente).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Checklist</h1>
        <p className="text-slate-500 text-sm">Acompanhamento de checklists</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Pendentes" value={pendentes} icon={AlertTriangle} color="yellow" alert={pendentes > 0} />
        <StatCard title="Concluídos" value={concluidos} icon={ClipboardCheck} color="green" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Responsável</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Data</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {checklists.map((c) => (
                <tr key={c.id} className={`hover:bg-slate-50 ${c.pendente ? 'bg-yellow-50/20' : ''}`}>
                  <td className="px-4 py-3 font-medium">{c.nomeClienteOriginal}</td>
                  <td className="px-4 py-3">{c.consultor?.nome || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.tipo || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatarData(c.dataChecklist)}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={c.pendente ? 'pendente' : 'concluido'} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{c.observacoes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
