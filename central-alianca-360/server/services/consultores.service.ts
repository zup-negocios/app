import { prisma } from '@/lib/prisma'
import { normalizarNome } from '@/lib/normalize'

export async function listarConsultores(apenasAtivos = true) {
  return prisma.consultor.findMany({
    where: apenasAtivos ? { ativo: true } : undefined,
    orderBy: { nome: 'asc' },
  })
}

export async function buscarOuCriarConsultor(nome: string) {
  const nomeNorm = normalizarNome(nome)
  const existente = await prisma.consultor.findFirst({
    where: { nomeNormalizado: nomeNorm },
  })
  if (existente) return existente

  return prisma.consultor.create({
    data: { nome, nomeNormalizado: nomeNorm },
  })
}
