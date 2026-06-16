import { criarBrowser, criarContexto, tirarScreenshot } from '../shared/browser'
import { fazerLoginExact } from './exact.login'
import { baixarVendasExact } from './exact.download-vendas'
import { baixarMontagensExact } from './exact.download-montagens'
import { baixarChecklistExact } from './exact.download-checklist'
import { baixarAgendamentosExact } from './exact.download-agendamentos'
import { logConsole } from '../shared/logger'
import { prisma } from '@/lib/prisma'
import { format, subDays } from 'date-fns'
import path from 'path'

export async function sincronizarExact(jobId?: string): Promise<void> {
  const browser = await criarBrowser(true)
  const downloadPath = path.join(process.cwd(), 'storage', 'imports', 'exact')
  const context = await criarContexto(browser, downloadPath)
  const page = await context.newPage()

  const dataFim = format(new Date(), 'dd/MM/yyyy')
  const dataInicio = format(subDays(new Date(), 30), 'dd/MM/yyyy')

  try {
    logConsole('info', 'Iniciando sincronização Exact')

    const loginOk = await fazerLoginExact(page)
    if (!loginOk) {
      logConsole('erro', 'Falha no login Exact — abortando sincronização')
      return
    }

    await baixarVendasExact(page, dataInicio, dataFim)
    await baixarMontagensExact(page, dataInicio, dataFim)
    await baixarChecklistExact(page, dataInicio, dataFim)
    await baixarAgendamentosExact(page, dataInicio, dataFim)

    await prisma.syncStatus.upsert({
      where: { sistema_tipo: { sistema: 'exact', tipo: 'completo' } },
      create: {
        sistema: 'exact',
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

    logConsole('info', 'Sincronização Exact concluída')
  } catch (error) {
    const screenshot = await tirarScreenshot(page, 'exact-erro-geral')
    logConsole('erro', 'Erro geral na sincronização Exact', { error: String(error), screenshot })

    await prisma.syncStatus.upsert({
      where: { sistema_tipo: { sistema: 'exact', tipo: 'completo' } },
      create: {
        sistema: 'exact',
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

// Run directly: npx ts-node automation/exact/exact.client.ts
if (require.main === module) {
  sincronizarExact().catch(console.error)
}
