import { prisma } from '@/lib/prisma'
import { calcularSimilaridadeCliente, normalizarNome, normalizarTelefone } from '@/lib/normalize'
import type { Prisma } from '@prisma/client'

const LIMIAR_CONFIRMACAO = 0.85
const LIMIAR_DIVERGENCIA = 0.5

export async function vincularVendaConsultor(vendaId: string): Promise<void> {
  const venda = await prisma.venda.findUnique({ where: { id: vendaId } })
  if (!venda || venda.consultorId) return

  // Find visits near venda date with same client name
  const visitas = await prisma.visita.findMany({
    where: {
      nomeClienteOriginal: { contains: venda.nomeClienteOriginal.substring(0, 5), mode: 'insensitive' },
    },
    include: { consultor: true },
  })

  for (const visita of visitas) {
    const sim = calcularSimilaridadeCliente(
      { nome: venda.nomeClienteOriginal },
      { nome: visita.nomeClienteOriginal }
    )

    if (sim >= LIMIAR_CONFIRMACAO && visita.consultorId) {
      await prisma.venda.update({
        where: { id: vendaId },
        data: { consultorId: visita.consultorId },
      })
      return
    }

    if (sim >= LIMIAR_DIVERGENCIA) {
      await prisma.divergencia.create({
        data: {
          tipo: 'venda_sem_consultor',
          entidadeOrigem: 'venda',
          entidadeDestino: 'visita',
          origemId: vendaId,
          destinoId: visita.id,
          descricao: `Venda "${venda.nomeClienteOriginal}" pode ser do consultor "${visita.consultor?.nome}"`,
          percentualSimilaridade: sim * 100,
          dadosOrigemJson: venda as unknown as Prisma.InputJsonValue,
          dadosDestinoJson: visita as unknown as Prisma.InputJsonValue,
        },
      })
      return
    }
  }

  // No match found — create divergence
  await prisma.divergencia.upsert({
    where: { id: `venda-sem-consultor-${vendaId}` },
    create: {
      id: `venda-sem-consultor-${vendaId}`,
      tipo: 'venda_sem_consultor',
      entidadeOrigem: 'venda',
      origemId: vendaId,
      descricao: `Venda de "${venda.nomeClienteOriginal}" sem consultor vinculado`,
      dadosOrigemJson: venda as unknown as Prisma.InputJsonValue,
    },
    update: {},
  })
}
