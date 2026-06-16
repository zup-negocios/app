import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const job = await prisma.integrationJob.create({
    data: { sistema: 'exact', tipo: 'completo', status: 'iniciado', startedAt: new Date() },
  })

  // Run async — don't await so the response returns quickly
  // The actual Playwright automation runs as a separate process via npm scripts
  // Here we just record the job and update sync status
  prisma.integrationJobLog.create({
    data: {
      jobId: job.id,
      nivel: 'info',
      mensagem: 'Job criado. Execute: npm run automation:exact para iniciar a sincronização completa.',
    },
  }).catch(() => {})

  await prisma.syncStatus.upsert({
    where: { sistema_tipo: { sistema: 'exact', tipo: 'completo' } },
    create: { sistema: 'exact', tipo: 'completo', ultimoStatus: 'iniciado', ultimaExecucao: new Date() },
    update: { ultimoStatus: 'iniciado', ultimaExecucao: new Date() },
  })

  return NextResponse.json({ ok: true, jobId: job.id, mensagem: 'Execute npm run automation:exact para sincronizar' })
}
