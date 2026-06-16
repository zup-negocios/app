import { prisma } from '@/lib/prisma'
import { formatarMoeda } from '@/lib/money'
import StatusBadge from '@/components/ui/StatusBadge'
import Link from 'next/link'

async function getConsultoresData() {
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const consultores = await prisma.consultor.findMany({
    where: { ativo: true },
    include: {
      visitas: { where: { dataVisita: { gte: inicioMes } } },
      vendas: { where: { dataVenda: { gte: inicioMes }, cancelada: false } },
      comissoes: { where: { mesReferencia: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` } },
    },
  })

  return consultores.map((c) => {
    const visitasExternas = c.visitas.filter((v) => v.tipoVisita === 'consultor_externo').length
    const visitasChecklist = c.visitas.filter((v) => v.tipoVisita === 'checklist').length
    const valorVendido = c.vendas.reduce((acc, v) => acc + Number(v.valorVendido), 0)
    const valorRevertido = c.vendas.reduce((acc, v) => acc + Number(v.valorRevertido), 0)
    const conversao = visitasExternas > 0 ? ((c.vendas.length / visitasExternas) * 100).toFixed(1) : '0.0'
    const comissao = c.comissoes[0]?.valorTotalEstimado ?? 0

    return {
      id: c.id,
      nome: c.nome,
      totalVisitas: c.visitas.length,
      visitasExternas,
      visitasChecklist,
      totalVendas: c.vendas.length,
      valorVendido,
      valorRevertido,
      conversao,
      comissao: Number(comissao),
    }
  })
}

export default async function ConsultoresPage() {
  const consultores = await getConsultoresData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultores</h1>
          <p className="text-slate-500 text-sm">Desempenho do mês atual</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Consultor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">Visitas</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">Ext.</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">Check.</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">Vendas</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Valor Vendido</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide">Conversão</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Comissão Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {consultores.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/consultores/${c.id}`} className="font-medium text-blue-600 hover:underline">
                      {c.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">{c.totalVisitas}</td>
                  <td className="px-4 py-3 text-center">{c.visitasExternas}</td>
                  <td className="px-4 py-3 text-center">{c.visitasChecklist}</td>
                  <td className="px-4 py-3 text-center">{c.totalVendas}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatarMoeda(c.valorVendido)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`badge ${Number(c.conversao) >= 30 ? 'bg-green-100 text-green-700' : Number(c.conversao) >= 15 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {c.conversao}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-700">{formatarMoeda(c.comissao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
