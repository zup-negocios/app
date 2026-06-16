import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') || 'pendente'

  const divergencias = await prisma.divergencia.findMany({
    where: { status: status as 'pendente' | 'confirmado' | 'rejeitado' | 'ignorado' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(divergencias)
}
