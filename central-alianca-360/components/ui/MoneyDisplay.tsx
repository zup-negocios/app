import { formatarMoeda } from '@/lib/money'

export default function MoneyDisplay({ valor, negativo }: { valor: number | string | null; negativo?: boolean }) {
  const num = Number(valor) || 0
  return (
    <span className={num < 0 || negativo ? 'text-red-600 font-medium' : 'text-slate-900'}>
      {formatarMoeda(num)}
    </span>
  )
}
