import { Navigate, Link } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAppState } from "../components/AppProvider";
import { currency, dateLabel } from "../utils/business";

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
    <main className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-[240px_1fr] gap-4">
      <Sidebar role="supplier" />
      <section className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl font-bold">Relatorio de clientes</h1>
          <button className="btn-primary" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
        </div>
        {!canSeeDetails && <div className="card p-6 text-gray-600">Para acessar os dados completos dos clientes, ative sua assinatura Zuppi.</div>}
        <div className="card overflow-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Empresa</th>
                <th className="text-left p-3">CNPJ</th>
                <th className="text-left p-3">Responsavel</th>
                <th className="text-left p-3">WhatsApp</th>
                <th className="text-left p-3">Cidade</th>
                <th className="text-left p-3">Reservas</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.buyer.id} className="border-t">
                  <td className="p-3 font-medium">{canSeeDetails ? row.buyer.companyName : "Cliente protegido"}</td>
                  <td className="p-3">{canSeeDetails ? row.buyer.cnpj : "--"}</td>
                  <td className="p-3">{canSeeDetails ? row.buyer.contactName : "--"}</td>
                  <td className="p-3">{canSeeDetails ? row.buyer.whatsapp : "--"}</td>
                  <td className="p-3">{canSeeDetails ? row.buyer.city : "--"}</td>
                  <td className="p-3">{row.reservations}</td>
                  <td className="p-3 font-semibold text-orange-600">{currency(row.amount)}</td>
                  <td className="p-3">{row.lastStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export function SupplierPurchasesReportPage() {
  const { session, offers, reservations } = useAppState();
  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const myOfferIds = new Set(offers.filter((offer) => offer.supplierId === session.id).map((offer) => offer.id));
  const rows = reservations.filter((reservation) => myOfferIds.has(reservation.offerId));
  const totalAmount = rows.reduce((acc, reservation) => acc + reservation.totalAmount, 0);
  const totalQuantity = rows.reduce((acc, reservation) => acc + reservation.quantity, 0);

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-[240px_1fr] gap-4">
      <Sidebar role="supplier" />
      <section className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl font-bold">Relatorio de compras</h1>
          <button className="btn-primary" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="card p-4"><p className="text-sm text-gray-500">Pre-pedidos</p><p className="text-2xl font-bold">{rows.length}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">Quantidade</p><p className="text-2xl font-bold">{totalQuantity}</p></div>
          <div className="card p-4"><p className="text-sm text-gray-500">Valor total</p><p className="text-2xl font-bold">{currency(totalAmount)}</p></div>
        </div>
        <div className="card overflow-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Oferta</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Quantidade</th>
                <th className="text-left p-3">Unitario</th>
                <th className="text-left p-3">Total</th>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Abrir</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((reservation) => (
                <tr key={reservation.id} className="border-t">
                  <td className="p-3 font-medium">{reservation.product}</td>
                  <td className="p-3">{reservation.buyerSnapshot.companyName}</td>
                  <td className="p-3">{reservation.quantity} {reservation.unit}</td>
                  <td className="p-3">{currency(reservation.unitPrice)}</td>
                  <td className="p-3 font-semibold text-orange-600">{currency(reservation.totalAmount)}</td>
                  <td className="p-3">{dateLabel(reservation.createdAt)}</td>
                  <td className="p-3">{reservation.status}</td>
                  <td className="p-3"><Link className="text-orange-600" to={`/fornecedor/ofertas/${reservation.offerId}`}>Detalhes</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
