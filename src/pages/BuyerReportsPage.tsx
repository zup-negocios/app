import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency, dateLabel, lastMonthOptions, monthKey, monthLabel } from "../utils/business";

const collectiveStatusLabel: Record<string, string> = {
  reservado: "Aguardando meta",
  aguardando_meta: "Aguardando meta",
  em_andamento: "Aguardando meta",
  meta_atingida: "Meta atingida",
  meta_batida: "Meta atingida",
  confirmado: "Pedido confirmado",
  entregue: "Concluído",
  cancelado: "Cancelado",
  venda_concluida: "Concluída",
  cliente_nao_cumpriu: "Não cumpriu",
  em_tratativa_com_fornecedor: "Em negociação",
};

const marketStatusLabel: Record<string, string> = {
  ordem_gerada: "Ordem gerada",
  fornecedor_notificado: "Notificado",
  em_tratativa_com_fornecedor: "Em negociação",
  venda_concluida: "Concluída",
  cliente_nao_cumpriu: "Não cumpriu",
  cancelada: "Cancelada",
};

type ReportTab = "tudo" | "market" | "coletiva" | "concluidas" | "economia";

export function BuyerReportsPage() {
  const { session, reservations, marketOrders, offers } = useAppState();
  const [month, setMonth] = useState(lastMonthOptions()[0].key);
  const [tab, setTab] = useState<ReportTab>("tudo");

  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const allMyReservations = useMemo(() => reservations.filter(r => r.buyerId === session.id && r.purchaseMode !== "market"), [reservations, session.id]);
  const allMyMarket = useMemo(() => marketOrders.filter(o => o.buyerId === session.id), [marketOrders, session.id]);

  const monthCollective = useMemo(() => allMyReservations.filter(r => monthKey(r.createdAt) === month), [allMyReservations, month]);
  const monthMarket = useMemo(() => allMyMarket.filter(o => monthKey(o.createdAt) === month), [allMyMarket, month]);

  const concludedCollective = monthCollective.filter(r => ["venda_concluida", "confirmado", "entregue"].includes(r.status));
  const concludedMarket = monthMarket.filter(o => o.status === "venda_concluida");

  const totalCollective = monthCollective.reduce((a, r) => a + r.totalAmount, 0);
  const totalMarket = monthMarket.reduce((a, o) => a + o.totalAmount, 0);
  const totalConcluded = [...concludedCollective, ...concludedMarket].reduce((a, r) => a + r.totalAmount, 0);

  const economy = useMemo(() => monthCollective.reduce((acc, r) => {
    const offer = offers.find(o => o.id === r.offerId);
    return offer ? acc + r.quantity * (offer.normalPrice - r.unitPrice) : acc;
  }, 0), [monthCollective, offers]);

  const TABS: { value: ReportTab; label: string }[] = [
    { value: "tudo", label: "Tudo" },
    { value: "market", label: "⚡ Market Zuppi" },
    { value: "coletiva", label: "👥 Compra coletiva" },
    { value: "concluidas", label: "Concluídas" },
    { value: "economia", label: "Economia" },
  ];

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-5xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Relatório mensal</h1>
            <p className="text-sm text-gray-400 mt-0.5">Acompanhe suas compras Market Zuppi e coletivas por mês.</p>
          </div>
          <div className="flex gap-2">
            <select value={month} onChange={e => setMonth(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
              {lastMonthOptions().map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={() => window.print()}>Exportar PDF</button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-orange-600">{monthMarket.length}</p>
            <p className="text-xs text-gray-500 mt-1">⚡ Compras Market</p>
            <p className="text-xs text-gray-400">{currency(totalMarket)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-blue-600">{monthCollective.length}</p>
            <p className="text-xs text-gray-500 mt-1">👥 Intenções coletivas</p>
            <p className="text-xs text-gray-400">{currency(totalCollective)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-green-600">{concludedCollective.length + concludedMarket.length}</p>
            <p className="text-xs text-gray-500 mt-1">Compras concluídas</p>
            <p className="text-xs text-gray-400">{currency(totalConcluded)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-green-500">{currency(economy)}</p>
            <p className="text-xs text-gray-500 mt-1">Economia estimada</p>
            <p className="text-xs text-gray-400">vs. preço normal</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${tab === t.value ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Market table */}
        {(tab === "tudo" || tab === "market" || tab === "concluidas") && (() => {
          const rows = tab === "concluidas" ? concludedMarket : monthMarket;
          if (rows.length === 0 && tab !== "tudo") return null;
          if (rows.length === 0) return null;
          return (
            <section>
              {tab === "tudo" && <h2 className="text-sm font-bold text-gray-500 mb-2">⚡ Market Zuppi</h2>}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {["Produto", "Fornecedor", "Qtd.", "Valor", "Status", "Data", ""].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{o.product}</td>
                        <td className="px-4 py-3 text-gray-600">{o.supplierSnapshot.companyName}</td>
                        <td className="px-4 py-3 text-gray-500">{o.quantity.toLocaleString("pt-BR")} {o.unit}</td>
                        <td className="px-4 py-3 font-semibold text-gray-700">{currency(o.totalAmount)}</td>
                        <td className="px-4 py-3"><span className="badge-ativa text-xs">{marketStatusLabel[o.status] || o.status}</span></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{dateLabel(o.createdAt)}</td>
                        <td className="px-4 py-3"><Link to={`/comprador/minhas-compras/market-${o.id}`} className="text-orange-600 text-xs font-semibold hover:underline">Detalhes</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })()}

        {/* Collective table */}
        {(tab === "tudo" || tab === "coletiva" || tab === "concluidas" || tab === "economia") && (() => {
          const rows = tab === "concluidas" ? concludedCollective : monthCollective;
          if (rows.length === 0 && tab !== "tudo") return null;
          if (rows.length === 0) return null;
          return (
            <section>
              {tab === "tudo" && <h2 className="text-sm font-bold text-gray-500 mb-2">👥 Compra coletiva</h2>}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {["Produto", "Fornecedor", "Qtd.", "Valor", tab === "economia" ? "Economia" : "Status", "Data", ""].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map(r => {
                      const offer = offers.find(o => o.id === r.offerId);
                      const saving = offer ? r.quantity * (offer.normalPrice - r.unitPrice) : 0;
                      return (
                        <tr key={r.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-800">{r.product}</td>
                          <td className="px-4 py-3 text-gray-600">{r.supplierSnapshot.companyName}</td>
                          <td className="px-4 py-3 text-gray-500">{r.quantity.toLocaleString("pt-BR")} {r.unit}</td>
                          <td className="px-4 py-3 font-semibold text-gray-700">{currency(r.totalAmount)}</td>
                          {tab === "economia"
                            ? <td className="px-4 py-3 font-semibold text-green-600">{saving > 0 ? currency(saving) : "—"}</td>
                            : <td className="px-4 py-3"><span className="badge-aguardando_aprovacao text-xs">{collectiveStatusLabel[r.status] || r.status}</span></td>}
                          <td className="px-4 py-3 text-gray-500 text-xs">{dateLabel(r.createdAt)}</td>
                          <td className="px-4 py-3"><Link to={`/comprador/minhas-compras/${r.id}`} className="text-orange-600 text-xs font-semibold hover:underline">Detalhes</Link></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })()}

        {monthMarket.length === 0 && monthCollective.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Nenhuma compra encontrada em {monthLabel(month)}.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
