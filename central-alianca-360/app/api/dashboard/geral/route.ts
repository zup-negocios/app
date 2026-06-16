import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [visitas, vendas, montagens, checklists, divergencias] = await Promise.all([
    prisma.visita.groupBy({
      by: ['tipoVisita'],
      where: { dataVisita: { gte: inicioMes } },
      _count: true,
    }),
    prisma.venda.findMany({
      where: { dataVenda: { gte: inicioMes } },
      select: { valorVendido: true, valorRevertido: true, cancelada: true, consultorId: true },
    }),
    prisma.montagem.groupBy({ by: ['status', 'atrasada'], _count: true }),
    prisma.checklist.count({ where: { pendente: true } }),
    prisma.divergencia.count({ where: { status: 'pendente' } }),
  ])

  const vendasAtivas = vendas.filter((v) => !v.cancelada)
  const valorVendido = vendasAtivas.reduce((acc, v) => acc + Number(v.valorVendido), 0)
  const valorRevertido = vendasAtivas.reduce((acc, v) => acc + Number(v.valorRevertido), 0)
  const visitasExternas = visitas.find((v) => v.tipoVisita === 'consultor_externo')?._count ?? 0
  const conversao = visitasExternas > 0 ? (vendasAtivas.length / visitasExternas) * 100 : 0

  return NextResponse.json({
    visitas: {
      total: visitas.reduce((a, v) => a + v._count, 0),
      externas: visitasExternas,
      checklist: visitas.find((v) => v.tipoVisita === 'checklist')?._count ?? 0,
    },
    vendas: {
      total: vendasAtivas.length,
      canceladas: vendas.filter((v) => v.cancelada).length,
      semConsultor: vendas.filter((v) => !v.consultorId && !v.cancelada).length,
      valorVendido,
      valorRevertido,
    },
    conversao,
    montagens: {
      agendadas: montagens.filter((m) => m.status === 'agendada').reduce((a, m) => a + m._count, 0),
      concluidas: montagens.filter((m) => m.status === 'concluida').reduce((a, m) => a + m._count, 0),
      atrasadas: montagens.filter((m) => m.atrasada).reduce((a, m) => a + m._count, 0),
    },
    checklistsPendentes: checklists,
    divergenciasPendentes: divergencias,
  })
}
