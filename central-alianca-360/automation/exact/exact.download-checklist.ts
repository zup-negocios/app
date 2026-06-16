import { Page } from 'playwright'
import { tirarScreenshot } from '../shared/browser'
import { logConsole } from '../shared/logger'

export async function baixarChecklistExact(
  page: Page,
  dataInicio: string,
  dataFim: string
): Promise<string | null> {
  try {
    // TODO: navigate to checklist section in Exact
    logConsole('warn', 'Download de checklist Exact: seletores ainda não mapeados (TODO)')
    return null
  } catch (error) {
    const screenshot = await tirarScreenshot(page, 'exact-checklist-erro')
    logConsole('erro', 'Erro ao baixar checklist Exact', { screenshot })
    return null
  }
}
