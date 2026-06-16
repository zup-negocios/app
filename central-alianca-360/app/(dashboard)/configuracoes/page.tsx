import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ConfiguracoesPage() {
  const session = await auth()
  if ((session?.user as { role?: string })?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>
        <p className="text-slate-500 text-sm">Configurações do sistema</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <p className="text-slate-500">Painel de configurações em desenvolvimento.</p>
      </div>
    </div>
  )
}
