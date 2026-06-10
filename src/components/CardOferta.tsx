import { Link } from "react-router-dom";
import type { Offer } from "../types";
import { useAppState } from "./AppProvider";
import { currency, dateLabel, formatGoal, offerProgress } from "../utils/business";
import { OfferCountdown } from "./OfferCountdown";
import { ProgressBarMeta } from "./ProgressBarMeta";
import { StarRating } from "./StarRating";

export function CardOferta({ offer }: { offer: Offer }) {
  const { getRatingSummary, session, suppliers } = useAppState();
  const progress = offerProgress(offer);
  const economy = offer.normalPrice - offer.zuppiPrice;
  const supplierRating = getRatingSummary(offer.supplierId, "supplier");
  const isLoggedIn = !!session;
  const supplier = suppliers.find(s => s.id === offer.supplierId);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="font-bold text-lg">{offer.product}</h3>
          <p className="text-sm text-gray-500">{offer.brand} · {offer.category}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">{offer.status.replace(/_/g, " ")}</span>
      </div>

      {/* Supplier row — blurred if not logged in */}
      <div className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 relative ${!isLoggedIn ? "bg-gray-50" : ""}`}>
        {isLoggedIn ? (
          <>
            <StarRating value={supplierRating.average} size={14} />
            <span className="text-gray-600">{supplierRating.count ? supplierRating.average.toFixed(1) : "sem nota"}</span>
            <span className="text-gray-400">·</span>
            <span className="font-medium text-gray-700">{supplier?.companyName || "Fornecedor"}</span>
          </>
        ) : (
          <div className="flex items-center gap-2 w-full">
            <div className="flex gap-0.5">{[1,2,3,4,5].map(i=><span key={i} className="w-3 h-3 rounded-sm bg-gray-200" />)}</div>
            <span className="text-gray-300 select-none blur-sm font-medium">Fornecedor Parceiro Zuppi</span>
            <span className="ml-auto text-[10px] font-semibold text-orange-500 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              🔒 Assine para ver
            </span>
          </div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        <p>Preco normal: <b>{currency(offer.normalPrice)}</b>/{offer.unit}</p>
        <p>Preco Zuppi: <b className="text-orange-600">{currency(offer.zuppiPrice)}</b>/{offer.unit}</p>
        <p>Economia: <b className="text-green-700">{currency(economy)}</b>/{offer.unit}</p>
        <p>Compra minima: <b>{offer.minimumPurchasePerBuyer} {offer.unit}</b></p>
        <p>Meta: <b>{formatGoal(offer, progress.target)}</b></p>
        <p>Faltam: <b>{formatGoal(offer, progress.missing)}</b></p>
        <p>Prazo: <b>{dateLabel(offer.deadline)}</b></p>
        <p>Regiao: <b>{offer.region}</b></p>
      </div>
      <OfferCountdown deadline={offer.deadline} compact />
      <ProgressBarMeta current={progress.current} total={progress.target} />
      <Link to={`/ofertas/${offer.id}`} className="btn-primary inline-block">Participar</Link>
    </div>
  );
}
