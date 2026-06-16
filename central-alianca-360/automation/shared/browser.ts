import { chromium, Browser, BrowserContext, Page } from 'playwright'
import path from 'path'
import fs from 'fs'

export async function criarBrowser(headless = true): Promise<Browser> {
  return chromium.launch({ headless, slowMo: headless ? 0 : 50 })
}

export async function criarContexto(browser: Browser, downloadPath: string): Promise<BrowserContext> {
  fs.mkdirSync(downloadPath, { recursive: true })
  return browser.newContext({
    acceptDownloads: true,
    locale: 'pt-BR',
  })
}

export async function tirarScreenshot(page: Page, nome: string): Promise<string> {
  const dir = path.join(process.cwd(), 'storage', 'screenshots')
  fs.mkdirSync(dir, { recursive: true })
  const caminho = path.join(dir, `${nome}-${Date.now()}.png`)
  await page.screenshot({ path: caminho, fullPage: true })
  return caminho
}

export async function aguardar(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
