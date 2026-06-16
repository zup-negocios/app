'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { clsx } from 'clsx'

interface SyncStatus {
  sistema: string
  tipo: string
  ultimoStatus?: string
  ultimaExecucao?: string
  mensagem?: string
}

export default function IntegracoesPage() {
  const [statuses, setStatuses] = useState<SyncStatus[]>([])
  const [sincronizando, setSincronizando] = useState<string | null>(null)
  const [logs, setLogs] = useState<{ sistema: string; nivel: string; mensagem: string; createdAt: string }[]>([])

  useEffect(() => {
    carregarStatus()
  }, [])

  async function carregarStatus() {
    const res = await fetch('/api/integracoes/status')
    const data = await res.json()
    setStatuses(data.statuses || [])
    setLogs(data.logs || [])
  }

  async function sincronizar(sistema: string) {
    setSincronizando(sistema)
    try {
      await fetch(`/api/integracoes/${sistema}/sincronizar`, { method: 'POST' })
      await carregarStatus()
    } finally {
      setSincronizando(null)
    }
  }

  const sistemas = [
    { id: 'exact', nome: 'Exact', descricao: 'Vendas, montagens e checklist' },
    { id: 'minha-visita', nome: 'Minha Visita', descricao: 'Visitas e consultores' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrações</h1>
        <p className="text-slate-500 text-sm">Sincronização com sistemas externos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sistemas.map((s) => {
          const status = statuses.find((st) => st.sistema === s.id)
          const ativo = sincronizando === s.id

          return (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{s.nome}</h3>
                  <p className="text-sm text-slate-500">{s.descricao}</p>
                </div>
                {status && (
                  <span className={clsx('badge', {
                    'bg-green-100 text-green-700': status.ultimoStatus === 'sucesso',
                    'bg-red-100 text-red-700': status.ultimoStatus === 'erro',
                    'bg-slate-100 text-slate-500': !status.ultimoStatus || status.ultimoStatus === 'nunca_executado',
                  })}>
                    {status.ultimoStatus === 'nunca_executado' ? 'Nunca executado' : status.ultimoStatus || 'Inativo'}
                  </span>
                )}
              </div>

              {status?.ultimaExecucao && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                  <Clock size={12} />
                  Última execução: {new Date(status.ultimaExecucao).toLocaleString('pt-BR')}
                </div>
              )}

              {status?.mensagem && (
                <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2 mb-3">{status.mensagem}</p>
              )}

              <button
                onClick={() => sincronizar(s.id)}
                disabled={!!sincronizando}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={14} className={ativo ? 'animate-spin' : ''} />
                {ativo ? 'Sincronizando...' : `Sincronizar ${s.nome}`}
              </button>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Logs Recentes</h3>
        <div className="space-y-1 font-mono text-xs max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-slate-400 py-4 text-center">Nenhum log disponível</p>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={clsx('px-3 py-1.5 rounded flex items-start gap-2', {
                  'bg-red-50 text-red-700': log.nivel === 'erro',
                  'bg-yellow-50 text-yellow-700': log.nivel === 'warn',
                  'bg-slate-50 text-slate-600': log.nivel === 'info',
                })}
              >
                <span className="text-slate-400 shrink-0">{new Date(log.createdAt).toLocaleTimeString('pt-BR')}</span>
                <span className="font-semibold shrink-0 uppercase text-xs">[{log.nivel}]</span>
                <span>{log.mensagem}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
