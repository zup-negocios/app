import { Navigate, Link } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAppState } from "../components/AppProvider";
import { currency, dateLabel } from "../utils/business";

const completedStatuses = ["confirmado", "entregue", "meta_atingida", "meta_batida"];

export function BuyerParticipatingOffersPage() {
  const { session, reservations, offers } = useAppState();
  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const participating = reservations.filter((reservation) => reservation.buyerId === session.id);

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-[240px_1fr] gap-4">
      <Sidebar role="buyer" />
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">Ofertas que estou participando</h1>
        {participating.length === 0 && <div className="card p-6 text-gray-600">Voce ainda nao esta participando de nenhuma oferta.</div>}
        {participating.map((reservation) => {
          const offer = offers.find((item) => item.id === reservation.offerId);
          return (
            <article key={reservation.id} className="card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold">{reservation.product}</h3>
                <p className="text-sm text-gray-600">{reservation.quantity} {reservation.unit} reservados - {currency(reservation.totalAmount)}</p>
                <p className="text-xs text-gray-500">Status: {reservation.status} - Reserva em {dateLabel(reservation.createdAt)}</p>
              </div>
              {offer && <Link className="btn-secondary" to={`/ofertas/${offer.id}`}>Abrir oferta</Link>}
            </article>
          );
        })}
      </section>
    </main>
  );
}

export function BuyerCompletedPurchasesPage() {
  const { session, reservations } = useAppState();
  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const purchases = reservations.filter((reservation) => reservation.buyerId === session.id && completedStatuses.includes(reservation.status));
  const total = purchases.reduce((acc, reservation) => acc + reservation.totalAmount, 0);

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-[240px_1fr] gap-4">
      <Sidebar role="buyer" />
      <section className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <h1 className="text-2xl font-bold">Compras realizadas</h1>
          <div className="card px-4 py-3 text-sm">Total realizado: <b>{currency(total)}</b></div>
        </div>
        {purchases.length === 0 && <div className="card p-6 text-gray-600">Nenhuma compra realizada ainda. Quando a meta for atingida, seus pre-pedidos aparecem aqui.</div>}
        {purchases.map((reservation) => (
          <article key={reservation.id} className="card p-4">
            <h3 className="font-bold">{reservation.product}</h3>
            <p className="text-sm text-gray-600">{reservation.quantity} {reservation.unit} x {currency(reservation.unitPrice)} = <b>{currency(reservation.totalAmount)}</b></p>
            <p className="text-xs text-gray-500">{reservation.status} - {dateLabel(reservation.createdAt)}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
