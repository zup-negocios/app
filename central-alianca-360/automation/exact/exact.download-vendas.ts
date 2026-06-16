import { Page } from 'playwright'
import path from 'path'
import { salvarDownload } from '../shared/downloads'
import { tirarScreenshot } from '../shared/browser'
import { logConsole } from '../shared/logger'

const DESTINO = path.join(process.cwd(), 'storage', 'imports', 'exact')

export async function baixarVendasExact(
  page: Page,
  dataInicio: string,
  dataFim: string
): Promise<string | null> {
  try {
    // TODO: navigate to correct Exact sales report page
    // await page.click('a[href*="vendas"], #menu-vendas, .nav-vendas')
    // await page.waitForNavigation()

    // TODO: apply date filters
    // await page.fill('#data-inicio, input[name="dataInicio"]', dataInicio)
    // await page.fill('#data-fim, input[name="dataFim"]', dataFim)
    // await page.click('#filtrar, .btn-filtrar, button[type="submit"]')
    // await page.waitForTimeout(2000)

    // TODO: click export/download button
    // const [download] = await Promise.all([
    //   page.waitForEvent('download'),
    //   page.click('#exportar, .btn-exportar, a[href*="export"], a[href*="excel"]'),
    // ])
    // const caminho = await salvarDownload(download, DESTINO, `vendas-${dataInicio}-${dataFim}.xlsx`)
    // logConsole('info', `Relatório de vendas baixado: ${caminho}`)
    // return caminho

    logConsole('warn', 'Download de vendas Exact: seletores ainda não mapeados (TODO)')
    return null
  } catch (error) {
    const screenshot = await tirarScreenshot(page, 'exact-vendas-erro')
    logConsole('erro', 'Erro ao baixar vendas Exact', { screenshot, error: String(error) })
    return null
  }
}
