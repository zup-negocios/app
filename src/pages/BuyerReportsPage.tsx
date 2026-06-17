import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency, dateLabel, lastMonthOptions, monthKey, monthLabel } from "../utils/business";

const statusLabel: Record<string, string> = {
  reservado: "Aguardando meta",
  aguardando_meta: "Aguardando meta",
  em_andamento: "Aguardando meta",
  meta_atingida: "Meta atingida",
  meta_batida: "Meta atingida",
  confirmado: "Pedido confirmado",
  entregue: "Concluído",
  cancelado: "Cancelado",
};

export function BuyerReportsPage() {
  const { session, reservations, offers } = useAppState();
  const [month, setMonth] = useState(lastMonthOptions()[0].key);

  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const allMyReservations = reservations.filter(r => r.buyerId === session.id);
  const rows = useMemo(() => allMyReservations.filter(r => monthKey(r.createdAt) === month), [allMyReservations, month]);

  const totalSpent = rows.reduce((a, r) => a + r.totalAmount, 0);
  const economy = rows.reduce((acc, r) => {
    const offer = offers.find(o => o.id === r.offerId);
    return offer ? acc + r.quantity * (offer.normalPrice - r.unitPrice) : acc;
  }, 0);

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-5xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Relatório mensal</h1>
            <p className="text-sm text-gray-400 mt-0.5">Veja tudo o que você comprou e reservou em cada mês.</p>
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

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-gray-800">{rows.length}</p>
            <p className="text-xs text-gray-500 mt-1">Reservas em {monthLabel(month)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-gray-800">{currency(totalSpent)}</p>
            <p className="text-xs text-gray-500 mt-1">Valor total reservado</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl font-bold text-green-600">{currency(economy)}</p>
            <p className="text-xs text-gray-500 mt-1">Economia estimada</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Nenhuma compra encontrada em {monthLabel(month)}.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Produto", "Fornecedor", "Quantidade", "Valor", "Status", "Data", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.product}</td>
                    <td className="px-4 py-3 text-gray-600">{r.supplierSnapshot.companyName}</td>
                    <td className="px-4 py-3 text-gray-500">{r.quantity.toLocaleString("pt-BR")} {r.unit}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{currency(r.totalAmount)}</td>
                    <td className="px-4 py-3"><span className="badge-ativa text-xs">{statusLabel[r.status] || r.status}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{dateLabel(r.createdAt)}</td>
                    <td className="px-4 py-3"><Link to={`/comprador/minhas-compras/${r.id}`} className="text-orange-600 text-xs font-semibold hover:underline">Ver detalhes</Link></td>
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
