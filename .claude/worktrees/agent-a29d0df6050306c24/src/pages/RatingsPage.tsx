import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { StarRating } from "../components/StarRating";
import { useAppState } from "../components/AppProvider";
import { currency } from "../utils/business";

export function RatingsPage() {
  const { session, reservations, offers, addRating, getRatingSummary } = useAppState();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});

  if (!session) return <Navigate to="/auth" replace />;

  const rows =
    session.role === "buyer"
      ? reservations.filter((reservation) => reservation.buyerId === session.id)
      : reservations.filter((reservation) => reservation.supplierId === session.id);

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-[240px_1fr] gap-4">
      <Sidebar role={session.role} />
      <section className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">Avaliacoes</h1>
          <p className="text-gray-600">Notas ajudam a reduzir risco de reserva sem compra e oferta sem entrega.</p>
        </div>
        {rows.length === 0 && <div className="card p-6 text-gray-600">Ainda nao ha operacoes para avaliar.</div>}
        {rows.map((reservation) => {
          const offer = offers.find((item) => item.id === reservation.offerId);
          const targetId = session.role === "buyer" ? reservation.supplierId : reservation.buyerId;
          const targetType = session.role === "buyer" ? "supplier" : "buyer";
          const summary = getRatingSummary(targetId, targetType);
          const score = scores[reservation.id] || 5;

          return (
            <article key={reservation.id} className="card p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <h3 className="font-bold">{reservation.product}</h3>
                  <p className="text-sm text-gray-600">
                    {session.role === "buyer" ? reservation.supplierSnapshot.companyName : reservation.buyerSnapshot.companyName} - {currency(reservation.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">Reputacao atual: {summary.count ? `${summary.average.toFixed(1)} / 5` : "sem nota"} {offer ? `- ${offer.status}` : ""}</p>
                </div>
                <StarRating value={score} onChange={(value) => setScores((current) => ({ ...current, [reservation.id]: value }))} />
              </div>
              <textarea
                className="border rounded-lg p-2 w-full"
                placeholder="Comentario da avaliacao"
                value={comments[reservation.id] || ""}
                onChange={(event) => setComments((current) => ({ ...current, [reservation.id]: event.target.value }))}
              />
              <button
                className="btn-primary"
                onClick={() =>
                  addRating({
                    reservationId: reservation.id,
                    offerId: reservation.offerId,
                    fromUserId: session.id,
                    fromRole: session.role,
                    targetId,
                    targetType,
                    score,
                    comment: comments[reservation.id] || "",
                  })
                }
              >
                Enviar avaliacao
              </button>
            </article>
          );
        })}
      </section>
    </main>
  );
}
