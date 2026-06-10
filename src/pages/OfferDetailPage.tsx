import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../components/AppProvider";
import { OfferCountdown } from "../components/OfferCountdown";
import { ProgressBarMeta } from "../components/ProgressBarMeta";
import { StarRating } from "../components/StarRating";
import { currency, dateLabel, formatGoal, offerProgress } from "../utils/business";

const quickQuantities = [50, 100, 250, 500];

export function OfferDetailPage() {
  const { id } = useParams();
  const { offers, session, reserve, getRatingSummary } = useAppState();
  const navigate = useNavigate();
  const offer = useMemo(() => offers.find((item) => item.id === id), [offers, id]);
  const [quantity, setQuantity] = useState(0);
  const [message, setMessage] = useState("");

  if (!offer) return <main className="max-w-4xl mx-auto p-8">Oferta nao encontrada.</main>;

  const progress = offerProgress(offer);
  const supplierRating = getRatingSummary(offer.supplierId, "supplier");
  const total = quantity * offer.zuppiPrice;
  const economy = quantity * (offer.normalPrice - offer.zuppiPrice);

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-4">
      <h1 className="text-3xl font-bold">{offer.product}</h1>
      <p className="text-gray-600">{offer.brand} - {offer.description}</p>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <StarRating value={supplierRating.average} />
        <span>{supplierRating.count ? `${supplierRating.average.toFixed(1)} de reputacao do fornecedor` : "Fornecedor ainda sem avaliacoes"}</span>
      </div>

      <div className="card p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-2">
          <p>Preco normal: <b>{currency(offer.normalPrice)}</b>/{offer.unit}</p>
          <p>Preco Zuppi: <b className="text-orange-600">{currency(offer.zuppiPrice)}</b>/{offer.unit}</p>
          <p>Tipo de meta: <b>{offer.targetType === "amount" ? "Valor financeiro" : "Quantidade"}</b></p>
          <p>Meta: <b>{formatGoal(offer, progress.target)}</b></p>
          <p>Reservado: <b>{formatGoal(offer, progress.current)}</b></p>
          <p>Faltam: <b className="text-orange-600">{formatGoal(offer, progress.missing)}</b></p>
          <p>Compra minima: <b>{offer.minimumPurchasePerBuyer} {offer.unit}</b></p>
          <p>Prazo da oferta: <b>{dateLabel(offer.deadline)}</b></p>
        </div>
        <OfferCountdown deadline={offer.deadline} />
        <ProgressBarMeta current={progress.current} total={progress.target} />
      </div>

      <div className="card p-4 space-y-3">
        <h2 className="font-bold">Participar da oferta</h2>
        <div className="flex flex-wrap gap-2">
          {quickQuantities.map((value) => (
            <button key={value} type="button" className="btn-secondary" onClick={() => setQuantity(value)}>{value} {offer.unit}</button>
          ))}
        </div>

        <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="border rounded-lg p-2 w-full" placeholder="Quantidade desejada" />
        <p>Valor total estimado: <b>{currency(total)}</b></p>
        <p className="text-green-700">Economia estimada: <b>{currency(economy)}</b></p>
        {message && <p className={`text-sm ${message.includes("sucesso") ? "text-green-700" : "text-red-600"}`}>{message}</p>}

        <button
          className="btn-primary"
          disabled={!session || session.role !== "buyer" || quantity <= 0}
          onClick={() => {
            if (!session || session.role !== "buyer") return navigate("/auth?type=buyer");
            const result = reserve(offer.id, session.id, quantity);
            setMessage(result.message || "");
            if (result.ok) setTimeout(() => navigate("/comprador/pedidos"), 700);
          }}
        >
          Reservar quantidade
        </button>
      </div>
    </main>
  );
}
