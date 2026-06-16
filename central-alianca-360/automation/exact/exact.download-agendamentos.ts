import { Page } from 'playwright'
import { tirarScreenshot } from '../shared/browser'
import { logConsole } from '../shared/logger'

export async function baixarAgendamentosExact(
  page: Page,
  dataInicio: string,
  dataFim: string
): Promise<string | null> {
  try {
    // TODO: navigate to agendamentos section in Exact
    logConsole('warn', 'Download de agendamentos Exact: seletores ainda não mapeados (TODO)')
    return null
  } catch (error) {
    const screenshot = await tirarScreenshot(page, 'exact-agendamentos-erro')
    logConsole('erro', 'Erro ao baixar agendamentos Exact', { screenshot })
    return null
  }
}
