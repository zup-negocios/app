import * as XLSX from 'xlsx'
import { prisma } from '@/lib/prisma'
import { normalizarNome, normalizarData, normalizarMoeda, normalizarTelefone } from '@/lib/normalize'

export type TipoImportacao = 'vendas' | 'visitas' | 'montagens' | 'checklist' | 'status_tatico' | 'valores_revertidos'

export function lerPlanilha(buffer: Buffer): Record<string, string>[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, string>[]
}

export function mapearColunas(
  dados: Record<string, string>[],
  mapeamento: Record<string, string>
): Record<string, string>[] {
  return dados.map((row) => {
    const novo: Record<string, string> = {}
    for (const [destino, origem] of Object.entries(mapeamento)) {
      novo[destino] = row[origem] ?? ''
    }
    return novo
  })
}

export async function processarVendas(
  dados: Record<string, string>[],
  importacaoId: string,
  usuarioId: string
): Promise<{ criados: number; atualizados: number; erros: number }> {
  let criados = 0, atualizados = 0, erros = 0

  for (const row of dados) {
    try {
      const nomeCliente = String(row.nomeCliente || row.cliente || row.CLIENTE || '')
      const dataVenda = normalizarData(String(row.dataVenda || row.data || row.DATA || ''))
      const valorVendido = normalizarMoeda(row.valorVendido || row.valor || row.VALOR || 0)

      if (!nomeCliente || !dataVenda) {
        erros++
        await prisma.importacaoLog.create({
          data: {
            importacaoId,
            nivel: 'warn',
            mensagem: `Linha ignorada: nome ou data ausente`,
            dadosJson: row as Record<string, unknown>,
          },
        })
        continue
      }

      const numeroVenda = String(row.numeroVenda || row.numero || row.NUMERO || '')
      const existing = numeroVenda
        ? await prisma.venda.findFirst({ where: { numeroVenda } })
        : null

      if (existing) {
        await prisma.venda.update({
          where: { id: existing.id },
          data: {
            valorVendido,
            valorRevertido: normalizarMoeda(row.valorRevertido || 0),
            status: String(row.status || existing.status || ''),
            updatedAt: new Date(),
          },
        })
        atualizados++
      } else {
        await prisma.venda.create({
          data: {
            nomeClienteOriginal: nomeCliente,
            numeroVenda: numeroVenda || undefined,
            numeroOrcamento: String(row.numeroOrcamento || row.orcamento || '') || undefined,
            vendedor: String(row.vendedor || '') || undefined,
            dataVenda,
            valorVendido,
            valorRevertido: normalizarMoeda(row.valorRevertido || 0),
            status: String(row.status || '') || undefined,
            statusTatico: String(row.statusTatico || '') || undefined,
            cancelada: String(row.cancelada || '').toLowerCase() === 'sim',
            origem: 'importacao',
            origemId: importacaoId,
          },
        })
        criados++
      }
    } catch (e) {
      erros++
      await prisma.importacaoLog.create({
        data: {
          importacaoId,
          nivel: 'erro',
          mensagem: `Erro ao processar linha: ${String(e)}`,
          dadosJson: row as Record<string, unknown>,
        },
      })
    }
  }

  return { criados, atualizados, erros }
}

export async function processarVisitas(
  dados: Record<string, string>[],
  importacaoId: string
): Promise<{ criados: number; erros: number }> {
  let criados = 0, erros = 0

  for (const row of dados) {
    try {
      const nomeCliente = String(row.nomeCliente || row.cliente || row.CLIENTE || '')
      const dataVisita = normalizarData(String(row.dataVisita || row.data || row.DATA || ''))

      if (!nomeCliente || !dataVisita) { erros++; continue }

      const tipoRaw = String(row.tipoVisita || row.tipo || '').toLowerCase()
      const tipoVisita = tipoRaw.includes('checklist')
        ? 'checklist'
        : tipoRaw.includes('externo') || tipoRaw.includes('consultor')
        ? 'consultor_externo'
        : null

      await prisma.visita.create({
        data: {
          nomeClienteOriginal: nomeCliente,
          telefoneOriginal: normalizarTelefone(String(row.telefone || '')) || undefined,
          enderecoOriginal: String(row.endereco || '') || undefined,
          tipoVisita: tipoVisita as 'consultor_externo' | 'checklist' | null,
          dataVisita,
          status: String(row.status || '') || undefined,
          observacoes: String(row.observacoes || '') || undefined,
          contaParaConversao: tipoVisita === 'consultor_externo',
          contaParaPagamento: tipoVisita !== null,
          origem: 'importacao',
          origemId: importacaoId,
        },
      })
      criados++
    } catch (e) {
      erros++
    }
  }

  return { criados, erros }
}
