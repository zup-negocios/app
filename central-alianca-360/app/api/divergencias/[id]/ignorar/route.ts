import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  await prisma.divergencia.update({
    where: { id: params.id },
    data: { status: 'ignorado' },
  })

  return NextResponse.json({ ok: true })
}
