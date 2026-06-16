import { criarBrowser, criarContexto, tirarScreenshot } from '../shared/browser'
import { fazerLoginMinhaVisita } from './minha-visita.login'
import { baixarVisitasMinhaVisita } from './minha-visita.download-visitas'
import { baixarChecklistMinhaVisita } from './minha-visita.download-checklist'
import { logConsole } from '../shared/logger'
import { prisma } from '@/lib/prisma'
import { format, subDays } from 'date-fns'
import path from 'path'

export async function sincronizarMinhaVisita(): Promise<void> {
  const browser = await criarBrowser(true)
  const downloadPath = path.join(process.cwd(), 'storage', 'imports', 'minha-visita')
  const context = await criarContexto(browser, downloadPath)
  const page = await context.newPage()

  const dataFim = format(new Date(), 'dd/MM/yyyy')
  const dataInicio = format(subDays(new Date(), 30), 'dd/MM/yyyy')

  try {
    logConsole('info', 'Iniciando sincronização Minha Visita')

    const loginOk = await fazerLoginMinhaVisita(page)
    if (!loginOk) {
      logConsole('erro', 'Falha no login Minha Visita — abortando')
      return
    }

    await baixarVisitasMinhaVisita(page, dataInicio, dataFim)
    await baixarChecklistMinhaVisita(page, dataInicio, dataFim)

    await prisma.syncStatus.upsert({
      where: { sistema_tipo: { sistema: 'minha-visita', tipo: 'completo' } },
      create: {
        sistema: 'minha-visita',
        tipo: 'completo',
        ultimoStatus: 'sucesso',
        ultimaExecucao: new Date(),
        ultimaExecucaoSucesso: new Date(),
      },
      update: {
        ultimoStatus: 'sucesso',
        ultimaExecucao: new Date(),
        ultimaExecucaoSucesso: new Date(),
      },
    })

    logConsole('info', 'Sincronização Minha Visita concluída')
  } catch (error) {
    const screenshot = await tirarScreenshot(page, 'minha-visita-erro-geral')
    logConsole('erro', 'Erro na sincronização Minha Visita', { error: String(error) })

    await prisma.syncStatus.upsert({
      where: { sistema_tipo: { sistema: 'minha-visita', tipo: 'completo' } },
      create: {
        sistema: 'minha-visita',
        tipo: 'completo',
        ultimoStatus: 'erro',
        ultimaExecucao: new Date(),
        mensagem: String(error),
      },
      update: {
        ultimoStatus: 'erro',
        ultimaExecucao: new Date(),
        mensagem: String(error),
      },
    })
  } finally {
    await browser.close()
  }
}

if (require.main === module) {
  sincronizarMinhaVisita().catch(console.error)
}
