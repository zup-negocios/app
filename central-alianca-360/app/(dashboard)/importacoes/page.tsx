'use client'

import { useState } from 'react'
import { Upload, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

type TipoImportacao = 'vendas' | 'visitas' | 'montagens' | 'checklist' | 'status_tatico' | 'valores_revertidos'

const tipos: { value: TipoImportacao; label: string }[] = [
  { value: 'vendas', label: 'Vendas' },
  { value: 'visitas', label: 'Visitas' },
  { value: 'montagens', label: 'Montagens' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'status_tatico', label: 'Status Tático' },
  { value: 'valores_revertidos', label: 'Valores Revertidos' },
]

export default function ImportacoesPage() {
  const [tipo, setTipo] = useState<TipoImportacao>('vendas')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'sucesso' | 'erro'>('idle')
  const [resultado, setResultado] = useState<{ criados: number; atualizados: number; erros: number; total: number } | null>(null)
  const [mensagemErro, setMensagemErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!arquivo) return

    setEstado('enviando')
    const formData = new FormData()
    formData.append('file', arquivo)
    formData.append('tipo', tipo)

    try {
      const res = await fetch('/api/importacoes/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.erro || 'Erro no upload')

      setResultado(data.resultado)
      setEstado('sucesso')
    } catch (err) {
      setMensagemErro(String(err))
      setEstado('erro')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Importações</h1>
        <p className="text-slate-500 text-sm">Upload manual de planilhas Excel e CSV</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
        <h2 className="font-semibold text-slate-900 mb-4">Nova Importação</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de dados</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoImportacao)}
              className="input-base"
            >
              {tipos.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo</label>
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) setArquivo(f)
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload size={32} className="mx-auto text-slate-400 mb-2" />
              {arquivo ? (
                <p className="text-sm font-medium text-blue-600">{arquivo.name}</p>
              ) : (
                <>
                  <p className="text-sm text-slate-600">Arraste ou clique para selecionar</p>
                  <p className="text-xs text-slate-400 mt-1">.xlsx, .xls, .csv</p>
                </>
              )}
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!arquivo || estado === 'enviando'}
            className="btn-primary w-full py-3 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {estado === 'enviando' ? (
              <><Loader2 size={16} className="animate-spin" /> Processando...</>
            ) : (
              <><Upload size={16} /> Importar Planilha</>
            )}
          </button>
        </form>
      </div>

      {estado === 'sucesso' && resultado && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-green-600" />
            <h3 className="font-semibold text-green-800">Importação concluída!</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center"><p className="text-2xl font-bold text-slate-800">{resultado.total}</p><p className="text-xs text-slate-500">Total</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-green-700">{resultado.criados}</p><p className="text-xs text-slate-500">Criados</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-blue-700">{resultado.atualizados}</p><p className="text-xs text-slate-500">Atualizados</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-red-700">{resultado.erros}</p><p className="text-xs text-slate-500">Erros</p></div>
          </div>
        </div>
      )}

      {estado === 'erro' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-2xl flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <p className="text-sm text-red-700">{mensagemErro}</p>
        </div>
      )}
    </div>
  )
}
