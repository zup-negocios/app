import { Download } from 'playwright'
import path from 'path'
import fs from 'fs'

export async function salvarDownload(
  download: Download,
  destino: string,
  nomeArquivo?: string
): Promise<string> {
  fs.mkdirSync(destino, { recursive: true })
  const nome = nomeArquivo || download.suggestedFilename() || `download-${Date.now()}`
  const caminho = path.join(destino, nome)
  await download.saveAs(caminho)
  return caminho
}
