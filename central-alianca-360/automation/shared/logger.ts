import { prisma } from '@/lib/prisma'

export type NivelLog = 'info' | 'warn' | 'erro' | 'debug'

export async function logJob(
  jobId: string,
  nivel: NivelLog,
  mensagem: string,
  dados?: Record<string, unknown>,
  screenshotPath?: string
) {
  console.log(`[${nivel.toUpperCase()}] ${mensagem}`)
  await prisma.integrationJobLog.create({
    data: {
      jobId,
      nivel,
      mensagem,
      dadosJson: dados ?? undefined,
      screenshotPath,
    },
  })
}

export function logConsole(nivel: NivelLog, mensagem: string, dados?: unknown) {
  const ts = new Date().toISOString()
  // NEVER log passwords or credentials
  const sanitized = JSON.stringify(dados ?? '')
    .replace(/"password":\s*"[^"]*"/g, '"password":"***"')
    .replace(/"senha":\s*"[^"]*"/g, '"senha":"***"')
  console.log(`[${ts}] [${nivel.toUpperCase()}] ${mensagem}`, sanitized !== '""' ? sanitized : '')
}
