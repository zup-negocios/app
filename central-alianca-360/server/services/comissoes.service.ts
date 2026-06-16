import { prisma } from '@/lib/prisma'
import { mesReferencia } from '@/lib/dates'

const VALOR_POR_VISITA = 40
const PERCENTUAL_COMISSAO = 1.5

export async function calcularComissaoConsultor(
  consultorId: string,
  mes: string = mesReferencia()
): Promise<void> {
  const [inicioMes, fimMes] = mesParaRange(mes)

  const visitas = await prisma.visita.findMany({
    where: {
      consultorId,
      dataVisita: { gte: inicioMes, lte: fimMes },
    },
  })

  const visitasExternas = visitas.filter((v) => v.tipoVisita === 'consultor_externo')
  const visitasChecklist = visitas.filter((v) => v.tipoVisita === 'checklist')
  const visitasPagaveis = visitas.filter((v) => v.contaParaPagamento)

  const vendas = await prisma.venda.findMany({
    where: {
      consultorId,
      cancelada: false,
      dataVenda: { gte: inicioMes, lte: fimMes },
    },
  })

  const valorVendido = vendas.reduce((acc, v) => acc + Number(v.valorVendido), 0)
  const valorRevertido = vendas.reduce((acc, v) => acc + Number(v.valorRevertido), 0)
  const valorLiquido = valorVendido - valorRevertido

  const valorVisitas = visitasPagaveis.length * VALOR_POR_VISITA
  const valorComissao = (valorLiquido * PERCENTUAL_COMISSAO) / 100
  const valorTotal = valorVisitas + valorComissao

  await prisma.comissao.upsert({
    where: { consultorId_mesReferencia: { consultorId, mesReferencia: mes } },
    create: {
      consultorId,
      mesReferencia: mes,
      totalVisitasConsultorExterno: visitasExternas.length,
      totalVisitasChecklist: visitasChecklist.length,
      totalVisitasPagaveis: visitasPagaveis.length,
      valorPorVisita: VALOR_POR_VISITA,
      valorTotalVisitas: valorVisitas,
      valorVendido,
      valorRevertido,
      percentualComissao: PERCENTUAL_COMISSAO,
      valorComissao,
      valorTotalEstimado: valorTotal,
    },
    update: {
      totalVisitasConsultorExterno: visitasExternas.length,
      totalVisitasChecklist: visitasChecklist.length,
      totalVisitasPagaveis: visitasPagaveis.length,
      valorTotalVisitas: valorVisitas,
      valorVendido,
      valorRevertido,
      valorComissao,
      valorTotalEstimado: valorTotal,
    },
  })
}

function mesParaRange(mes: string): [Date, Date] {
  const [ano, m] = mes.split('-').map(Number)
  const inicio = new Date(ano, m - 1, 1)
  const fim = new Date(ano, m, 0, 23, 59, 59)
  return [inicio, fim]
}
