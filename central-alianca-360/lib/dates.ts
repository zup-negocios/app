import { format, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? parseISO(data) : data
  if (!isValid(d)) return '-'
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatarDataHora(data: Date | string): string {
  const d = typeof data === 'string' ? parseISO(data) : data
  if (!isValid(d)) return '-'
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function mesAtual(): { inicio: Date; fim: Date } {
  const now = new Date()
  return { inicio: startOfMonth(now), fim: endOfMonth(now) }
}

export function mesReferencia(data: Date = new Date()): string {
  return format(data, 'yyyy-MM')
}
