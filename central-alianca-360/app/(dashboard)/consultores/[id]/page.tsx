import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { formatarData } from '@/lib/dates'
import { formatarMoeda } from '@/lib/money'
import StatusBadge from '@/components/ui/StatusBadge'
import StatCard from '@/components/ui/StatCard'
import { Users, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'

async function getConsultorDetalhe(id: string) {
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const consultor = await prisma.consultor.findUnique({
    where: { id },
    include: {
      visitas: {
        where: { dataVisita: { gte: inicioMes } },
        include: { cliente: { select: { nome: true } } },
        orderBy: { dataVisita: 'desc' },
      },
      vendas: {
        where: { dataVenda: { gte: inicioMes } },
        orderBy: { dataVenda: 'desc' },
      },
    },
  })

  if (!consultor) notFound()
  return consultor
}

export default async function ConsultorDetalhePage({ params }: { params: { id: string } }) {
  const consultor = await getConsultorDetalhe(params.id)

  const visitasExternas = consultor.visitas.filter((v) => v.tipoVisita === 'consultor_externo')
  const visitasChecklist = consultor.visitas.filter((v) => v.tipoVisita === 'checklist')
  const vendasAtivas = consultor.vendas.filter((v) => !v.cancelada)
  const valorVendido = vendasAtivas.reduce((acc, v) => acc + Number(v.valorVendido), 0)
  const conversao = visitasExternas.length > 0
    ? ((vendasAtivas.length / visitasExternas.length) * 100).toFixed(1)
    : '0.0'
  const comissaoEstimada = (valorVendido * 1.5) / 100 + visitasExternas.length * 40 + visitasChecklist.length * 40

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/consultores" className="text-slate-400 hover:text-slate-600 text-sm">← Consultores</Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-bold text-slate-900">{consultor.nome}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Visitas Externas" value={visitasExternas.length} icon={Users} color="purple" />
        <StatCard title="Visitas Checklist" value={visitasChecklist.length} icon={Users} color="teal" />
        <StatCard title="Vendas Ativas" value={vendasAtivas.length} icon={ShoppingBag} color="green" />
        <StatCard title="Conversão" value={`${conversao}%`} icon={TrendingUp} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard title="Valor Vendido" value={formatarMoeda(valorVendido)} icon={DollarSign} color="purple" />
        <StatCard title="Comissão Estimada" value={formatarMoeda(comissaoEstimada)} icon={DollarSign} color="green" subtitle="Visitas + 1,5% sobre vendas" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Visitas do Mês</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Data</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consultor.visitas.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{v.nomeClienteOriginal}</td>
                  <td className="px-4 py-3 text-slate-500">{formatarData(v.dataVisita)}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={v.tipoVisita || 'desconhecido'} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={v.status || 'realizada'} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{v.observacoes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Vendas do Mês</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Nº Venda</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Data</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consultor.vendas.map((v) => (
                <tr key={v.id} className={`hover:bg-slate-50 ${v.cancelada ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs">{v.numeroVenda || '—'}</td>
                  <td className="px-4 py-3">{v.nomeClienteOriginal}</td>
                  <td className="px-4 py-3 text-slate-500">{formatarData(v.dataVenda)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatarMoeda(Number(v.valorVendido))}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={v.cancelada ? 'cancelada' : (v.status || 'aprovada')} />
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
