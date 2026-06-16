import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { lerPlanilha, processarVendas, processarVisitas } from '@/server/services/importacao.service'
import path from 'path'
import fs from 'fs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })

  const userId = (session.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ erro: 'Usuário inválido' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const tipo = formData.get('tipo') as string

  if (!file) return NextResponse.json({ erro: 'Arquivo não enviado' }, { status: 400 })

  const nomeArquivo = file.name
  const buffer = Buffer.from(await file.arrayBuffer())

  const dir = path.join(process.cwd(), 'storage', 'imports', 'manual')
  fs.mkdirSync(dir, { recursive: true })
  const caminhoArquivo = path.join(dir, `${Date.now()}-${nomeArquivo}`)
  fs.writeFileSync(caminhoArquivo, buffer)

  const importacao = await prisma.importacao.create({
    data: {
      usuarioId: userId,
      tipo,
      nomeArquivo,
      caminhoArquivo,
      status: 'processando',
      startedAt: new Date(),
    },
  })

  try {
    const dados = lerPlanilha(buffer)
    let resultado = { criados: 0, atualizados: 0, erros: 0 }

    if (tipo === 'vendas') {
      const r = await processarVendas(dados, importacao.id, userId)
      resultado = { ...resultado, ...r }
    } else if (tipo === 'visitas') {
      const r = await processarVisitas(dados, importacao.id)
      resultado = { ...resultado, criados: r.criados, erros: r.erros }
    } else {
      await prisma.importacaoLog.create({
        data: { importacaoId: importacao.id, nivel: 'warn', mensagem: `Tipo "${tipo}" ainda não implementado para processamento automático` },
      })
    }

    await prisma.importacao.update({
      where: { id: importacao.id },
      data: {
        status: 'concluida',
        totalRegistros: dados.length,
        registrosProcessados: resultado.criados + resultado.atualizados,
        registrosComErro: resultado.erros,
        finishedAt: new Date(),
      },
    })

    return NextResponse.json({ ok: true, resultado: { ...resultado, total: dados.length } })
  } catch (error) {
    await prisma.importacao.update({
      where: { id: importacao.id },
      data: { status: 'erro', finishedAt: new Date() },
    })
    return NextResponse.json({ erro: String(error) }, { status: 500 })
  }
}
