import { Page } from 'playwright'
import path from 'path'
import { tirarScreenshot } from '../shared/browser'
import { logConsole } from '../shared/logger'

const DESTINO = path.join(process.cwd(), 'storage', 'imports', 'exact')

export async function baixarMontagensExact(
  page: Page,
  dataInicio: string,
  dataFim: string
): Promise<string | null> {
  try {
    // TODO: navigate to montagens section in Exact
    // TODO: apply filters and download
    logConsole('warn', 'Download de montagens Exact: seletores ainda não mapeados (TODO)')
    return null
  } catch (error) {
    const screenshot = await tirarScreenshot(page, 'exact-montagens-erro')
    logConsole('erro', 'Erro ao baixar montagens Exact', { screenshot })
    return null
  }
}
