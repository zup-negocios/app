import { useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency, dateLabel, lastMonthOptions, monthKey, monthLabel } from "../utils/business";

export function SupplierClientsReportPage() {
  const { session, suppliers, buyers, offers, reservations } = useAppState();
  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const supplier = suppliers.find((item) => item.id === session.id);
  const myOfferIds = new Set(offers.filter((offer) => offer.supplierId === session.id).map((offer) => offer.id));
  const myReservations = reservations.filter((reservation) => myOfferIds.has(reservation.offerId));
  const canSeeDetails = supplier?.planoFornecedor === "assinante";
  const rows = buyers
    .map((buyer) => {
      const buyerReservations = myReservations.filter((reservation) => reservation.buyerId === buyer.id);
      if (buyerReservations.length === 0) return null;
      return {
        buyer,
        reservations: buyerReservations.length,
        quantity: buyerReservations.reduce((acc, reservation) => acc + reservation.quantity, 0),
        amount: buyerReservations.reduce((acc, reservation) => acc + reservation.totalAmount, 0),
        lastStatus: buyerReservations[buyerReservations.length - 1].status,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.amount - a.amount);

  return (
    <DashboardLayout role="supplier">
      <div className="max-w-6xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-xl font-bold text-gray-800">Relatório de clientes</h1>
          <button className="btn-primary" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
        </div>
        {!canSeeDetails && <div className="bg-white rounded-2xl border border-gray-100 p-5 text-gray-600 text-sm">Para acessar os dados completos dos clientes, ative sua assinatura Zuppi.</div>}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["Empresa", "CNPJ", "Responsável", "WhatsApp", "Cidade", "Reservas", "Valor", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => (
                <tr key={row.buyer.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">{canSeeDetails ? row.buyer.companyName : "Cliente protegido"}</td>
                  <td className="px-4 py-3 text-gray-500">{canSeeDetails ? row.buyer.cnpj : "--"}</td>
                  <td className="px-4 py-3 text-gray-500">{canSeeDetails ? row.buyer.contactName : "--"}</td>
                  <td className="px-4 py-3 text-gray-500">{canSeeDetails ? row.buyer.whatsapp : "--"}</td>
                  <td className="px-4 py-3 text-gray-500">{canSeeDetails ? row.buyer.city : "--"}</td>
                  <td className="px-4 py-3 text-gray-500">{row.reservations}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700">{currency(row.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{row.lastStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

type ReportTab = "geral" | "market" | "coletiva" | "concluidos" | "nao_cumpriu";

const REPORT_TAB_LABELS: { value: ReportTab; label: string }[] = [
  { value: "geral", label: "Visão geral" },
  { value: "market", label: "⚡ Market Zuppi" },
  { value: "coletiva", label: "👥 Compra coletiva" },
  { value: "concluidos", label: "Vendas concluídas" },
  { value: "nao_cumpriu", label: "Clientes não cumpriram" },
];

export function SupplierPurchasesReportPage() {
  const { session, offers, reservations, marketOrders } = useAppState();
  const [month, setMonth] = useState(lastMonthOptions()[0].key);
  const [reportTab, setReportTab] = useState<ReportTab>("geral");

  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const myOfferIds = new Set(offers.filter((offer) => offer.supplierId === session.id).map((offer) => offer.id));

  const allCollective = reservations.filter(r => myOfferIds.has(r.offerId) && r.purchaseMode !== "market");
  const allMarket = marketOrders.filter(o => myOfferIds.has(o.offerId));

  const collectiveRows = useMemo(() => allCollective.filter(r => monthKey(r.createdAt) === month), [allCollective, month]);
  const marketRows = useMemo(() => allMarket.filter(o => monthKey(o.createdAt) === month), [allMarket, month]);

  const concludedCollective = collectiveRows.filter(r => ["venda_concluida", "confirmado", "entregue"].includes(r.status));
  const concludedMarket = marketRows.filter(o => o.status === "venda_concluida");
  const notFulfilledCollective = collectiveRows.filter(r => r.status === "cliente_nao_cumpriu");
  const notFulfilledMarket = marketRows.filter(o => o.status === "cliente_nao_cumpriu");

  const totalMarket = marketRows.reduce((a, o) => a + o.totalAmount, 0);
  const totalCollective = collectiveRows.reduce((a, r) => a + r.totalAmount, 0);
  const totalConcluded = [...concludedCollective, ...concludedMarket].reduce((a, r) => a + r.totalAmount, 0);

  const allForMonth = [...marketRows.map(o => ({ ...o, kind: "market" as const })), ...collectiveRows.map(r => ({ ...r, kind: "collective" as const }))];

  const visibleRows = useMemo(() => {
    switch (reportTab) {
      case "market": return allForMonth.filter(r => r.kind === "market");
      case "coletiva": return allForMonth.filter(r => r.kind === "collective");
      case "concluidos": return allForMonth.filter(r => ["venda_concluida", "confirmado", "entregue"].includes(r.status));
      case "nao_cumpriu": return allForMonth.filter(r => r.status === "cliente_nao_cumpriu");
      default: return allForMonth;
    }
  }, [allForMonth, reportTab]);

  return (
    <DashboardLayout role="supplier">
      <div className="max-w-6xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Relatórios</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Acompanhe o que foi realizado a cada mês. <Link to="/fornecedor/relatorio-clientes" className="text-orange-500 font-semibold hover:underline">Ver relatório de clientes</Link>
            </p>
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
            <p className="text-2xl font-bold text-orange-600">{currency(totalMarket)}</p>
            <p className="text-xs text-gray-500 mt-1">⚡ Market Zuppi em {monthLabel(month)}</p>
            <p className="text-xs text-gray-400">{marketRows.length} ordens</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-blue-600">{currency(totalCollective)}</p>
            <p className="text-xs text-gray-500 mt-1">👥 Compras coletivas em {monthLabel(month)}</p>
            <p className="text-xs text-gray-400">{collectiveRows.length} intenções</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-green-600">{currency(totalConcluded)}</p>
            <p className="text-xs text-gray-500 mt-1">Vendas concluídas</p>
            <p className="text-xs text-gray-400">{concludedCollective.length + concludedMarket.length} transações</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-red-500">{notFulfilledCollective.length + notFulfilledMarket.length}</p>
            <p className="text-xs text-gray-500 mt-1">Clientes não cumpriram</p>
            <p className="text-xs text-gray-400">{notFulfilledCollective.length + notFulfilledMarket.length > 0 ? "Atenção ao perfil de clientes" : "Sem ocorrências"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {REPORT_TAB_LABELS.map(t => (
            <button key={t.value} onClick={() => setReportTab(t.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${reportTab === t.value ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {visibleRows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Nenhum pedido encontrado em {monthLabel(month)} para o filtro selecionado.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Tipo", "Produto", "Cliente", "Qtd.", "Unitário", "Total", "Status", "Data"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibleRows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.kind === "market" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-600"}`}>
                        {row.kind === "market" ? "⚡ Market" : "👥 Coletiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.product}</td>
                    <td className="px-4 py-3 text-gray-600">{row.buyerSnapshot.companyName}</td>
                    <td className="px-4 py-3 text-gray-500">{row.quantity.toLocaleString("pt-BR")} {row.unit}</td>
                    <td className="px-4 py-3 text-gray-500">{currency(row.kind === "market" ? row.unitPrice : (row.finalPrice ?? (row.quantity > 0 ? row.totalAmount / row.quantity : 0)))}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{currency(row.totalAmount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.status}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{dateLabel(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
