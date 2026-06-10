import { Navigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAppState } from "../components/AppProvider";
import { currency, dateLabel } from "../utils/business";

const labels: Record<string, string> = {
  reservado: "Reservado",
  aguardando_meta: "Aguardando meta",
  meta_atingida: "Meta atingida",
  confirmado: "Confirmado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  em_andamento: "Em andamento",
  meta_batida: "Meta batida",
};

export function BuyerOrdersPage() {
  const { session, reservations } = useAppState();
  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const myReservations = reservations.filter((reservation) => reservation.buyerId === session.id);

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-[240px_1fr] gap-4">
      <Sidebar role="buyer" />
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">Meus pedidos</h1>
        {myReservations.length === 0 && <div className="card p-6 text-gray-600">Voce ainda nao tem pre-pedidos.</div>}
        {myReservations.map((reservation) => (
          <article key={reservation.id} className="card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-bold">{reservation.product}</h3>
              <p className="text-sm text-gray-600">{reservation.brand} - {reservation.category}</p>
              <p className="text-sm text-gray-600">{reservation.quantity} {reservation.unit} x {currency(reservation.unitPrice)} = <b>{currency(reservation.totalAmount)}</b></p>
              <p className="text-xs text-gray-500">Reserva em {dateLabel(reservation.createdAt)}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm w-fit">{labels[reservation.status]}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
