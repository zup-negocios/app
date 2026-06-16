import { FileX } from 'lucide-react'

export default function EmptyState({ title = 'Nenhum registro', description = 'Não há dados para exibir.' }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <FileX size={40} className="mb-3" />
      <p className="font-medium text-slate-600">{title}</p>
      <p className="text-sm mt-1">{description}</p>
    </div>
  )
}
