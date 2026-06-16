import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import StatCard from '@/components/ui/StatCard'
import { formatarMoeda } from '@/lib/money'
import { formatarDataHora } from '@/lib/dates'
import {
  Users, ShoppingBag, Wrench, ClipboardCheck,
  AlertTriangle, TrendingUp, DollarSign, GitMerge
} from 'lucide-react'
import Link from 'next/link'

async function getDashboardData() {
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const [
    totalVisitas,
    visitasExternas,
    visitasChecklist,
    totalVendas,
    vendasCanceladas,
    vendasSemConsultor,
    montagens,
    montagensAtrasadas,
    checklistsPendentes,
    divergenciasPendentes,
    syncStatuses,
    ultimasImportacoes,
  ] = await Promise.all([
    prisma.visita.count({ where: { dataVisita: { gte: inicioMes } } }),
    prisma.visita.count({ where: { dataVisita: { gte: inicioMes }, tipoVisita: 'consultor_externo' } }),
    prisma.visita.count({ where: { dataVisita: { gte: inicioMes }, tipoVisita: 'checklist' } }),
    prisma.venda.findMany({ where: { dataVenda: { gte: inicioMes }, cancelada: false }, select: { valorVendido: true, valorRevertido: true } }),
    prisma.venda.count({ where: { dataVenda: { gte: inicioMes }, cancelada: true } }),
    prisma.venda.count({ where: { cancelada: false, consultorId: null } }),
    prisma.montagem.count({ where: { status: { not: 'concluida' } } }),
    prisma.montagem.count({ where: { atrasada: true, status: { not: 'concluida' } } }),
    prisma.checklist.count({ where: { pendente: true } }),
    prisma.divergencia.count({ where: { status: 'pendente' } }),
    prisma.syncStatus.findMany(),
    prisma.importacao.findMany({ take: 3, orderBy: { createdAt: 'desc' }, include: { usuario: { select: { name: true } } } }),
  ])

  const valorVendido = totalVendas.reduce((acc, v) => acc + Number(v.valorVendido), 0)
  const valorRevertido = totalVendas.reduce((acc, v) => acc + Number(v.valorRevertido), 0)
  const conversao = visitasExternas > 0 ? ((totalVendas.length / visitasExternas) * 100).toFixed(1) : '0.0'

  return {
    totalVisitas, visitasExternas, visitasChecklist,
    totalVendas: totalVendas.length, vendasCanceladas, vendasSemConsultor,
    valorVendido, valorRevertido, conversao,
    montagens, montagensAtrasadas,
    checklistsPendentes, divergenciasPendentes,
    syncStatuses, ultimasImportacoes,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  const data = await getDashboardData()

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {saudacao}, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">Resumo do mês atual</p>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Visitas" value={data.totalVisitas} subtitle={`${data.visitasExternas} externas · ${data.visitasChecklist} checklist`} icon={Users} color="blue" />
        <StatCard title="Vendas Efetivadas" value={data.totalVendas} subtitle={`${data.vendasCanceladas} canceladas`} icon={ShoppingBag} color="green" />
        <StatCard title="Valor Vendido" value={formatarMoeda(data.valorVendido)} subtitle={`Revertido: ${formatarMoeda(data.valorRevertido)}`} icon={DollarSign} color="purple" />
        <StatCard title="Conversão" value={`${data.conversao}%`} subtitle="Visitas → Vendas" icon={TrendingUp} color="blue" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Montagens Agendadas" value={data.montagens} icon={Wrench} color="slate" />
        <StatCard title="Montagens Atrasadas" value={data.montagensAtrasadas} icon={Wrench} color="red" alert={data.montagensAtrasadas > 0} />
        <StatCard title="Checklists Pendentes" value={data.checklistsPendentes} icon={ClipboardCheck} color="yellow" />
        <StatCard title="Divergências Pendentes" value={data.divergenciasPendentes} icon={GitMerge} color="red" alert={data.divergenciasPendentes > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas críticos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            Alertas Críticos
          </h3>
          <div className="space-y-2">
            {data.vendasSemConsultor > 0 && (
              <div className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-3">
                <span className="text-sm text-red-700">{data.vendasSemConsultor} vendas sem consultor</span>
                <Link href="/divergencias" className="text-xs text-red-600 font-medium hover:underline">Ver →</Link>
              </div>
            )}
            {data.montagensAtrasadas > 0 && (
              <div className="flex items-center justify-between bg-orange-50 rounded-lg px-4 py-3">
                <span className="text-sm text-orange-700">{data.montagensAtrasadas} montagens atrasadas</span>
                <Link href="/montagens" className="text-xs text-orange-600 font-medium hover:underline">Ver →</Link>
              </div>
            )}
            {data.divergenciasPendentes > 0 && (
              <div className="flex items-center justify-between bg-yellow-50 rounded-lg px-4 py-3">
                <span className="text-sm text-yellow-700">{data.divergenciasPendentes} divergências para revisar</span>
                <Link href="/divergencias" className="text-xs text-yellow-600 font-medium hover:underline">Ver →</Link>
              </div>
            )}
            {data.vendasSemConsultor === 0 && data.montagensAtrasadas === 0 && data.divergenciasPendentes === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Nenhum alerta crítico 🎉</p>
            )}
          </div>
        </div>

        {/* Status das integrações */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" />
            Integrações
          </h3>
          <div className="space-y-3">
            {data.syncStatuses.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700 capitalize">{s.sistema}</p>
                  <p className="text-xs text-slate-400">
                    {s.ultimaExecucao ? formatarDataHora(s.ultimaExecucao) : 'Nunca executado'}
                  </p>
                </div>
                <span className={`badge ${
                  s.ultimoStatus === 'sucesso' ? 'bg-green-100 text-green-700' :
                  s.ultimoStatus === 'erro' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {s.ultimoStatus || 'inativo'}
                </span>
              </div>
            ))}
            <Link href="/integracoes" className="text-xs text-blue-600 hover:underline block mt-2">
              Gerenciar integrações →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
