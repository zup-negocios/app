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

export function SupplierPurchasesReportPage() {
  const { session, offers, reservations } = useAppState();
  const [month, setMonth] = useState(lastMonthOptions()[0].key);

  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const myOfferIds = new Set(offers.filter((offer) => offer.supplierId === session.id).map((offer) => offer.id));
  const allRows = reservations.filter((reservation) => myOfferIds.has(reservation.offerId));
  const rows = useMemo(() => allRows.filter(r => monthKey(r.createdAt) === month), [allRows, month]);

  const totalAmount = rows.reduce((acc, reservation) => acc + reservation.totalAmount, 0);
  const totalQuantity = rows.reduce((acc, reservation) => acc + reservation.quantity, 0);
  const bestOffer = useMemo(() => {
    const byOffer = new Map<string, number>();
    rows.forEach(r => byOffer.set(r.product, (byOffer.get(r.product) || 0) + r.totalAmount));
    const sorted = [...byOffer.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "—";
  }, [rows]);

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

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-gray-800">{currency(totalAmount)}</p>
            <p className="text-xs text-gray-500 mt-1">Total reservado em {monthLabel(month)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-gray-800">{rows.length}</p>
            <p className="text-xs text-gray-500 mt-1">Pré-pedidos recebidos</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-gray-800">{totalQuantity.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-gray-500 mt-1">Quantidade total</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-base font-bold text-gray-800 truncate">{bestOffer}</p>
            <p className="text-xs text-gray-500 mt-1">Produto mais buscado</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Nenhum pré-pedido encontrado em {monthLabel(month)}.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Oferta", "Cliente", "Quantidade", "Unitário", "Total", "Data", "Status", "Abrir"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{reservation.product}</td>
                    <td className="px-4 py-3 text-gray-600">{reservation.buyerSnapshot.companyName}</td>
                    <td className="px-4 py-3 text-gray-500">{reservation.quantity} {reservation.unit}</td>
                    <td className="px-4 py-3 text-gray-500">{currency(reservation.unitPrice)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{currency(reservation.totalAmount)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{dateLabel(reservation.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-500">{reservation.status}</td>
                    <td className="px-4 py-3"><Link className="text-orange-600 text-xs font-semibold hover:underline" to={`/fornecedor/ofertas/${reservation.offerId}`}>Detalhes</Link></td>
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
