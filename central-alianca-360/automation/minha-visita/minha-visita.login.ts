import { Page } from 'playwright'
import { tirarScreenshot } from '../shared/browser'
import { logConsole } from '../shared/logger'

export async function fazerLoginMinhaVisita(page: Page): Promise<boolean> {
  const url = process.env.MINHA_VISITA_URL
  const usuario = process.env.MINHA_VISITA_USER
  const senha = process.env.MINHA_VISITA_PASSWORD

  if (!url || !usuario || !senha) {
    logConsole('erro', 'Credenciais Minha Visita não configuradas')
    return false
  }

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

    // TODO: map real selectors after inspecting Minha Visita login page
    await page.fill('input[name="email"], input[type="email"], #email, #usuario', usuario)
    await page.fill('input[type="password"], #senha, #password', senha)
    await page.click('button[type="submit"], .btn-entrar, #login, input[type="submit"]')

    await page.waitForTimeout(3000)

    // TODO: validate login success
    const loggedIn = await page
      .locator('.dashboard, #home, nav.sidebar, .menu-principal')
      .first()
      .isVisible()
      .catch(() => false)

    logConsole('info', 'Login Minha Visita realizado')
    return true
  } catch (error) {
    const screenshot = await tirarScreenshot(page, 'minha-visita-login-erro')
    logConsole('erro', 'Falha no login Minha Visita', { screenshot })
    return false
  }
}
