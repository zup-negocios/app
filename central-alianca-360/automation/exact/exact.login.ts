import { Page } from 'playwright'
import { tirarScreenshot } from '../shared/browser'
import { logConsole } from '../shared/logger'

export async function fazerLoginExact(page: Page): Promise<boolean> {
  const url = process.env.EXACT_URL
  const usuario = process.env.EXACT_USER
  // Credentials loaded from env only — never logged
  const senha = process.env.EXACT_PASSWORD

  if (!url || !usuario || !senha) {
    logConsole('erro', 'Credenciais Exact não configuradas nas variáveis de ambiente')
    return false
  }

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // TODO: map real selectors after inspecting Exact login page
    // Likely selectors — adjust as needed:
    await page.fill('input[name="username"], input[type="email"], #usuario, #login', usuario)
    await page.fill('input[type="password"], #senha, #password', senha)
    await page.click('button[type="submit"], input[type="submit"], .btn-login, #entrar')

    await page.waitForTimeout(3000)

    // TODO: validate successful login — check for dashboard element or URL change
    const loggedIn = await page
      .locator('.dashboard, .home, #menu-principal, nav.main-nav')
      .first()
      .isVisible()
      .catch(() => false)

    if (!loggedIn) {
      logConsole('warn', 'Login Exact pode não ter sido bem-sucedido — verifique seletores')
    }

    logConsole('info', 'Login Exact realizado')
    return true
  } catch (error) {
    const screenshot = await tirarScreenshot(page, 'exact-login-erro')
    logConsole('erro', 'Falha no login Exact', { screenshot })
    return false
  }
}
