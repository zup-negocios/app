import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const [statuses, jobs] = await Promise.all([
    prisma.syncStatus.findMany(),
    prisma.integrationJob.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { logs: { take: 5, orderBy: { createdAt: 'desc' } } },
    }),
  ])

  const logs = jobs.flatMap((j) =>
    j.logs.map((l) => ({ sistema: j.sistema, nivel: l.nivel, mensagem: l.mensagem, createdAt: l.createdAt.toISOString() }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50)

  return NextResponse.json({ statuses, logs })
}
