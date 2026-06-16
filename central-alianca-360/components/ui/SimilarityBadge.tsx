import { clsx } from 'clsx'

export default function SimilarityBadge({ valor }: { valor: number }) {
  const pct = Math.round(valor)
  const classe =
    pct >= 85 ? 'bg-green-100 text-green-700' :
    pct >= 50 ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700'

  return (
    <span className={clsx('badge', classe)}>
      {pct}% similaridade
    </span>
  )
}
