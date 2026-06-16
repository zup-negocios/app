import stringSimilarity from 'string-similarity'

export function removerAcentos(str: string): string {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function removerPontuacao(str: string): string {
  return str.replace(/[^\w\s]/gi, '').replace(/_/g, '')
}

export function caixaAlta(str: string): string {
  return str.toUpperCase()
}

export function limparEspacos(str: string): string {
  return str.replace(/\s+/g, ' ').trim()
}

export function normalizarNome(nome: string): string {
  if (!nome) return ''
  return limparEspacos(caixaAlta(removerPontuacao(removerAcentos(nome))))
}

export function normalizarTelefone(tel: string): string {
  if (!tel) return ''
  return tel.replace(/\D/g, '')
}

export function normalizarEndereco(end: string): string {
  if (!end) return ''
  return limparEspacos(caixaAlta(removerPontuacao(removerAcentos(end))))
}

export function normalizarMoeda(valor: string | number): number {
  if (typeof valor === 'number') return valor
  if (!valor) return 0
  const limpo = String(valor)
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  return parseFloat(limpo) || 0
}

export function normalizarData(data: string | Date): Date | null {
  if (!data) return null
  if (data instanceof Date) return data
  // Try common Brazilian formats: DD/MM/YYYY, YYYY-MM-DD
  const br = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (br) return new Date(`${br[3]}-${br[2]}-${br[1]}`)
  const iso = new Date(data)
  return isNaN(iso.getTime()) ? null : iso
}

export function compararStrings(a: string, b: string): number {
  if (!a || !b) return 0
  return stringSimilarity.compareTwoStrings(
    normalizarNome(a),
    normalizarNome(b)
  )
}

export interface DadosCliente {
  nome?: string
  telefone?: string
  endereco?: string
  numeroVenda?: string
  numeroOrcamento?: string
}

export function calcularSimilaridadeCliente(
  origem: DadosCliente,
  destino: DadosCliente
): number {
  // Número de venda ou orçamento igual = 100%
  if (
    origem.numeroVenda &&
    destino.numeroVenda &&
    origem.numeroVenda === destino.numeroVenda
  )
    return 1
  if (
    origem.numeroOrcamento &&
    destino.numeroOrcamento &&
    origem.numeroOrcamento === destino.numeroOrcamento
  )
    return 1

  let score = 0
  let peso = 0

  // Telefone igual = alta confiança (peso 0.5)
  if (origem.telefone && destino.telefone) {
    const telA = normalizarTelefone(origem.telefone)
    const telB = normalizarTelefone(destino.telefone)
    if (telA && telB && telA === telB) {
      score += 0.5
    }
    peso += 0.5
  }

  // Nome (peso 0.3)
  if (origem.nome && destino.nome) {
    score += compararStrings(origem.nome, destino.nome) * 0.3
    peso += 0.3
  }

  // Endereço (peso 0.2)
  if (origem.endereco && destino.endereco) {
    score += compararStrings(origem.endereco, destino.endereco) * 0.2
    peso += 0.2
  }

  if (peso === 0) return 0
  return score / peso
}
