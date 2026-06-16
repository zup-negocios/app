import { listarPendencias } from '@/server/services/pendencias.service'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { clsx } from 'clsx'

const prioridadeCor = {
  alta: 'border-l-4 border-red-400 bg-red-50/30',
  media: 'border-l-4 border-yellow-400 bg-yellow-50/30',
  baixa: 'border-l-4 border-blue-400 bg-blue-50/20',
}

const prioridadeBadge = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-yellow-100 text-yellow-700',
  baixa: 'bg-blue-100 text-blue-700',
}

export default async function PendenciasPage() {
  const pendencias = await listarPendencias()

  const altas = pendencias.filter((p) => p.prioridade === 'alta').length
  const medias = pendencias.filter((p) => p.prioridade === 'media').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pendências</h1>
          <p className="text-slate-500 text-sm">{pendencias.length} pendências ativas</p>
        </div>
        <div className="flex gap-3">
          {altas > 0 && <span className="badge bg-red-100 text-red-700">{altas} alta{altas !== 1 ? 's' : ''}</span>}
          {medias > 0 && <span className="badge bg-yellow-100 text-yellow-700">{medias} média{medias !== 1 ? 's' : ''}</span>}
        </div>
      </div>

      <div className="space-y-3">
        {pendencias.map((p) => (
          <div key={p.id} className={clsx('bg-white rounded-xl p-5 shadow-sm', prioridadeCor[p.prioridade])}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={clsx('badge', prioridadeBadge[p.prioridade])}>
                    {p.prioridade.toUpperCase()}
                  </span>
                  <span className="badge bg-slate-100 text-slate-600 capitalize">
                    {p.tipo.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="font-medium text-slate-900">{p.descricao}</p>
                {p.cliente && <p className="text-sm text-slate-500 mt-0.5">Cliente: {p.cliente}</p>}
                {p.responsavel && <p className="text-sm text-slate-500">Responsável: {p.responsavel}</p>}
                <p className="text-xs text-blue-600 mt-2">→ {p.acaoRecomendada}</p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200">
                  <CheckCircle size={13} /> Resolver
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200">
                  <XCircle size={13} /> Ignorar
                </button>
              </div>
            </div>
          </div>
        ))}

        {pendencias.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
            <p className="font-medium text-slate-700">Nenhuma pendência</p>
            <p className="text-sm text-slate-400">Tudo em dia!</p>
          </div>
        )}
      </div>
    </div>
  )
}
