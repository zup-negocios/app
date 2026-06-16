export function formatarMoeda(valor: number | string | null | undefined): string {
  const num = Number(valor) || 0
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

export function formatarPorcentagem(valor: number | null | undefined): string {
  const num = Number(valor) || 0
  return `${num.toFixed(1)}%`
}
