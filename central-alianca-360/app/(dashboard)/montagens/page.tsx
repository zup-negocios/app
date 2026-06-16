import { prisma } from '@/lib/prisma'
import { formatarData } from '@/lib/dates'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import { Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default async function MontagensPage() {
  const montagens = await prisma.montagem.findMany({
    include: { venda: { select: { numeroVenda: true } } },
    orderBy: { dataAgendada: 'desc' },
  })

  const agendadas = montagens.filter((m) => m.status === 'agendada').length
  const concluidas = montagens.filter((m) => m.status === 'concluida').length
  const atrasadas = montagens.filter((m) => m.atrasada).length
  const comProblema = montagens.filter((m) => m.problema).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Montagens</h1>
        <p className="text-slate-500 text-sm">Controle de agendamentos e execuções</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Agendadas" value={agendadas} icon={Clock} color="blue" />
        <StatCard title="Concluídas" value={concluidas} icon={CheckCircle} color="green" />
        <StatCard title="Atrasadas" value={atrasadas} icon={AlertTriangle} color="red" alert={atrasadas > 0} />
        <StatCard title="Com Problema" value={comProblema} icon={Wrench} color="yellow" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nº Venda</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Endereço</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Montador</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Agendada</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Realizada</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Problema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {montagens.map((m) => (
                <tr key={m.id} className={`hover:bg-slate-50 ${m.atrasada ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-medium">{m.nomeClienteOriginal}</td>
                  <td className="px-4 py-3 font-mono text-xs">{m.venda?.numeroVenda || m.numeroVenda || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{m.endereco || '—'}</td>
                  <td className="px-4 py-3">{m.montador || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{m.dataAgendada ? formatarData(m.dataAgendada) : '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{m.dataRealizada ? formatarData(m.dataRealizada) : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={m.atrasada ? 'atrasada' : m.reagendada ? 'reagendada' : (m.status || 'agendada')} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate" title={m.problema || ''}>
                    {m.problema || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
