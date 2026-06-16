'use client'

import { useEffect, useState } from 'react'
import SimilarityBadge from '@/components/ui/SimilarityBadge'
import StatusBadge from '@/components/ui/StatusBadge'
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react'

interface Divergencia {
  id: string
  tipo: string
  descricao?: string
  percentualSimilaridade?: number
  status: string
  dadosOrigemJson?: Record<string, unknown>
  dadosDestinoJson?: Record<string, unknown>
  createdAt: string
}

export default function DivergenciasPage() {
  const [divergencias, setDivergencias] = useState<Divergencia[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState<string>('pendente')

  useEffect(() => {
    fetch('/api/divergencias?status=' + filtro)
      .then((r) => r.json())
      .then((d) => { setDivergencias(d); setCarregando(false) })
  }, [filtro])

  async function acao(id: string, tipo: 'confirmar' | 'rejeitar' | 'ignorar') {
    await fetch(`/api/divergencias/${id}/${tipo}`, { method: 'POST' })
    setDivergencias((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Divergências</h1>
          <p className="text-slate-500 text-sm">Validação manual de vínculos</p>
        </div>
        <div className="flex gap-2">
          {(['pendente', 'confirmado', 'rejeitado', 'ignorado'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtro === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {divergencias.map((d) => (
            <div key={d.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="badge bg-slate-100 text-slate-600 capitalize">{d.tipo.replace(/_/g, ' ')}</span>
                    {d.percentualSimilaridade != null && <SimilarityBadge valor={d.percentualSimilaridade} />}
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="font-medium text-slate-900">{d.descricao || 'Divergência detectada'}</p>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {d.dadosOrigemJson && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1">ORIGEM</p>
                        {Object.entries(d.dadosOrigemJson).slice(0, 5).map(([k, v]) => (
                          <p key={k} className="text-xs text-slate-600"><span className="font-medium">{k}:</span> {String(v)}</p>
                        ))}
                      </div>
                    )}
                    {d.dadosDestinoJson && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 mb-1">DESTINO</p>
                        {Object.entries(d.dadosDestinoJson).slice(0, 5).map(([k, v]) => (
                          <p key={k} className="text-xs text-slate-600"><span className="font-medium">{k}:</span> {String(v)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {d.status === 'pendente' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => acao(d.id, 'confirmar')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200">
                      <CheckCircle size={13} /> Confirmar
                    </button>
                    <button onClick={() => acao(d.id, 'rejeitar')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200">
                      <XCircle size={13} /> Rejeitar
                    </button>
                    <button onClick={() => acao(d.id, 'ignorar')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200">
                      <MinusCircle size={13} /> Ignorar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {divergencias.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <CheckCircle size={40} className="mx-auto text-green-400 mb-3" />
              <p className="font-medium text-slate-700">Nenhuma divergência {filtro}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
