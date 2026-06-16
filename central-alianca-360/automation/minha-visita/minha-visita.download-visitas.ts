import { Page } from 'playwright'
import path from 'path'
import { tirarScreenshot } from '../shared/browser'
import { logConsole } from '../shared/logger'

const DESTINO = path.join(process.cwd(), 'storage', 'imports', 'minha-visita')

export async function baixarVisitasMinhaVisita(
  page: Page,
  dataInicio: string,
  dataFim: string
): Promise<string | null> {
  try {
    // TODO: navigate to visitas/relatorios section in Minha Visita
    // TODO: apply period filters
    // TODO: click export button

    logConsole('warn', 'Download de visitas Minha Visita: seletores ainda não mapeados (TODO)')
    return null
  } catch (error) {
    const screenshot = await tirarScreenshot(page, 'minha-visita-visitas-erro')
    logConsole('erro', 'Erro ao baixar visitas Minha Visita', { screenshot })
    return null
  }
}
