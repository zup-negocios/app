import { prisma } from '@/lib/prisma'

export interface Pendencia {
  id: string
  tipo: string
  prioridade: 'alta' | 'media' | 'baixa'
  descricao: string
  cliente?: string
  responsavel?: string
  data?: string
  origem?: string
  acaoRecomendada: string
  dados?: Record<string, unknown>
}

export async function listarPendencias(): Promise<Pendencia[]> {
  const pendencias: Pendencia[] = []

  // Vendas sem consultor
  const vendasSemConsultor = await prisma.venda.findMany({
    where: { consultorId: null, cancelada: false },
    take: 50,
  })
  for (const v of vendasSemConsultor) {
    pendencias.push({
      id: `venda-sem-consultor-${v.id}`,
      tipo: 'venda_sem_consultor',
      prioridade: 'alta',
      descricao: `Venda de "${v.nomeClienteOriginal}" sem consultor vinculado`,
      cliente: v.nomeClienteOriginal,
      responsavel: v.vendedor || undefined,
      data: v.dataVenda.toISOString(),
      origem: v.origem || undefined,
      acaoRecomendada: 'Vincular consultor responsável pela visita',
    })
  }

  // Vendas sem montagem
  const vendasSemMontagem = await prisma.venda.findMany({
    where: { cancelada: false, montagens: { none: {} } },
    take: 50,
  })
  for (const v of vendasSemMontagem) {
    pendencias.push({
      id: `venda-sem-montagem-${v.id}`,
      tipo: 'venda_sem_montagem',
      prioridade: 'media',
      descricao: `Venda "${v.numeroVenda || v.nomeClienteOriginal}" sem montagem agendada`,
      cliente: v.nomeClienteOriginal,
      acaoRecomendada: 'Agendar montagem',
    })
  }

  // Montagens atrasadas
  const montagensAtrasadas = await prisma.montagem.findMany({
    where: { atrasada: true, status: { not: 'concluida' } },
    take: 50,
  })
  for (const m of montagensAtrasadas) {
    pendencias.push({
      id: `montagem-atrasada-${m.id}`,
      tipo: 'montagem_atrasada',
      prioridade: 'alta',
      descricao: `Montagem de "${m.nomeClienteOriginal}" está atrasada`,
      cliente: m.nomeClienteOriginal,
      responsavel: m.montador || undefined,
      acaoRecomendada: 'Reagendar ou confirmar realização',
    })
  }

  // Checklists pendentes
  const checklistsPendentes = await prisma.checklist.findMany({
    where: { pendente: true },
    take: 50,
  })
  for (const c of checklistsPendentes) {
    pendencias.push({
      id: `checklist-pendente-${c.id}`,
      tipo: 'checklist_pendente',
      prioridade: 'media',
      descricao: `Checklist pendente para "${c.nomeClienteOriginal}"`,
      cliente: c.nomeClienteOriginal,
      acaoRecomendada: 'Realizar e registrar checklist',
    })
  }

  // Divergências pendentes
  const divergencias = await prisma.divergencia.findMany({
    where: { status: 'pendente' },
    take: 30,
  })
  for (const d of divergencias) {
    pendencias.push({
      id: `divergencia-${d.id}`,
      tipo: 'divergencia',
      prioridade: 'media',
      descricao: d.descricao || 'Divergência pendente de revisão',
      acaoRecomendada: 'Revisar e confirmar ou rejeitar vínculo',
    })
  }

  return pendencias
}
