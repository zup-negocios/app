import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listarPendencias } from '@/server/services/pendencias.service'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const pendencias = await listarPendencias()
  return NextResponse.json(pendencias)
}
