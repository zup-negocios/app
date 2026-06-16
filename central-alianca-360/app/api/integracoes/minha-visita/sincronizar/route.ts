import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const job = await prisma.integrationJob.create({
    data: { sistema: 'minha-visita', tipo: 'completo', status: 'iniciado', startedAt: new Date() },
  })

  await prisma.syncStatus.upsert({
    where: { sistema_tipo: { sistema: 'minha-visita', tipo: 'completo' } },
    create: { sistema: 'minha-visita', tipo: 'completo', ultimoStatus: 'iniciado', ultimaExecucao: new Date() },
    update: { ultimoStatus: 'iniciado', ultimaExecucao: new Date() },
  })

  return NextResponse.json({ ok: true, jobId: job.id, mensagem: 'Execute npm run automation:minha-visita para sincronizar' })
}
