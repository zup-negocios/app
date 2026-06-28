import { Navigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAppState } from "../components/AppProvider";

export function ProfilePage() {
  const { session, buyers, suppliers, getRatingSummary } = useAppState();
  if (!session) return <Navigate to="/auth" replace />;

  const isBuyer = session.role === "buyer";
  const profile = isBuyer ? buyers.find((buyer) => buyer.id === session.id) : suppliers.find((supplier) => supplier.id === session.id);
  if (!profile) return <Navigate to="/auth" replace />;
  const rating = getRatingSummary(profile.id, isBuyer ? "buyer" : "supplier");

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-[240px_1fr] gap-4">
      <Sidebar role={session.role} />
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Dados cadastrais</h1>
          <p className="text-gray-600">Informacoes principais da conta e reputacao dentro da Zup.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="card p-4"><p className="text-sm text-gray-500">Empresa</p><p className="font-bold">{profile.companyName}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">CNPJ</p><p className="font-bold">{profile.cnpj}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">Responsavel</p><p className="font-bold">{profile.contactName}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">WhatsApp</p><p className="font-bold">{profile.whatsapp}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">E-mail</p><p className="font-bold">{profile.email}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">Cidade</p><p className="font-bold">{profile.city}</p></div>
          {"segment" in profile && <div className="card p-4"><p className="text-sm text-gray-500">Segmento</p><p className="font-bold">{profile.segment}</p></div>}
          {"supplierType" in profile && <div className="card p-4"><p className="text-sm text-gray-500">Tipo</p><p className="font-bold">{profile.supplierType}</p></div>}
          {"planoFornecedor" in profile && <div className="card p-4"><p className="text-sm text-gray-500">Plano</p><p className="font-bold">{profile.planoFornecedor}</p></div>}
          <div className="card p-4"><p className="text-sm text-gray-500">Reputacao</p><p className="font-bold">{rating.count ? `${rating.average.toFixed(1)} / 5 (${rating.count} avaliacoes)` : "Sem avaliacoes"}</p></div>
        </div>
      </section>
    </main>
  );
}
