import { Page } from 'playwright'
import { tirarScreenshot } from '../shared/browser'
import { logConsole } from '../shared/logger'

export async function baixarChecklistMinhaVisita(
  page: Page,
  dataInicio: string,
  dataFim: string
): Promise<string | null> {
  try {
    // TODO: navigate to checklist section in Minha Visita
    logConsole('warn', 'Download de checklist Minha Visita: seletores ainda não mapeados (TODO)')
    return null
  } catch (error) {
    const screenshot = await tirarScreenshot(page, 'minha-visita-checklist-erro')
    logConsole('erro', 'Erro ao baixar checklist Minha Visita', { screenshot })
    return null
  }
}
