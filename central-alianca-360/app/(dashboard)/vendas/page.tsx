import { prisma } from '@/lib/prisma'
import { formatarData } from '@/lib/dates'
import { formatarMoeda } from '@/lib/money'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import { ShoppingBag, DollarSign, AlertTriangle, XCircle } from 'lucide-react'

async function getVendasData() {
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const vendas = await prisma.venda.findMany({
    where: { dataVenda: { gte: inicioMes } },
    include: {
      consultor: { select: { nome: true } },
      montagens: { select: { id: true, status: true } },
    },
    orderBy: { dataVenda: 'desc' },
  })

  return vendas
}

export default async function VendasPage() {
  const vendas = await getVendasData()

  const ativas = vendas.filter((v) => !v.cancelada)
  const canceladas = vendas.filter((v) => v.cancelada)
  const semConsultor = vendas.filter((v) => !v.consultorId && !v.cancelada)
  const semMontagem = ativas.filter((v) => v.montagens.length === 0)
  const valorTotal = ativas.reduce((acc, v) => acc + Number(v.valorVendido), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vendas</h1>
        <p className="text-slate-500 text-sm">Mês atual</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Vendas Ativas" value={ativas.length} icon={ShoppingBag} color="green" />
        <StatCard title="Valor Total" value={formatarMoeda(valorTotal)} icon={DollarSign} color="purple" />
        <StatCard title="Sem Consultor" value={semConsultor.length} icon={AlertTriangle} color="red" alert={semConsultor.length > 0} />
        <StatCard title="Canceladas" value={canceladas.length} icon={XCircle} color="red" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nº Venda</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Consultor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Vendedor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Data</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Montagem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendas.map((v) => (
                <tr key={v.id} className={`hover:bg-slate-50 ${v.cancelada ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs">{v.numeroVenda || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{v.nomeClienteOriginal}</td>
                  <td className="px-4 py-3">
                    {v.consultor ? (
                      <span className="text-slate-700">{v.consultor.nome}</span>
                    ) : (
                      <span className="badge bg-red-100 text-red-700">Sem consultor</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{v.vendedor || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatarData(v.dataVenda)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatarMoeda(Number(v.valorVendido))}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={v.cancelada ? 'cancelada' : (v.status || 'aprovada')} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {v.montagens.length > 0 ? (
                      <StatusBadge status={v.montagens[0].status || 'agendada'} />
                    ) : (
                      <span className="badge bg-yellow-100 text-yellow-700">Pendente</span>
                    )}
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
