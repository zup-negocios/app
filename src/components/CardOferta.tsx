import { Link } from "react-router-dom";
import type { Offer } from "../types";
import { useAppState } from "./AppProvider";
import { currency, offerProgress } from "../utils/business";
import { OfferCountdown } from "./OfferCountdown";
import { Package } from "lucide-react";

export function CardOferta({ offer }: { offer: Offer }) {
  const { session, suppliers } = useAppState();
  const progress = offerProgress(offer);
  const pct = Math.min(100, Math.round((progress.current / progress.target) * 100));
  const economy = Math.round(((offer.normalPrice - offer.zuppiPrice) / offer.normalPrice) * 100);
  const supplier = suppliers.find(s => s.id === offer.supplierId);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* image placeholder */}
        <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
          <Package size={32} className="text-orange-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">{offer.product}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{offer.brand} · {offer.category}</p>
            </div>
            {economy > 0 && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                -{economy}%
              </span>
            )}
          </div>

          <div className="flex items-end gap-4 mt-2">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Preço atual</p>
              <p className="text-base font-black text-gray-800">{currency(offer.zuppiPrice)}<span className="text-xs font-normal text-gray-400">/{offer.unit}</span></p>
              <p className="text-[10px] text-gray-400 line-through">{currency(offer.normalPrice)}/{offer.unit}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-gray-400 uppercase font-medium">Meta</p>
              <p className="text-base font-black text-orange-500">{progress.target.toLocaleString("pt-BR")}</p>
              <p className="text-[10px] text-gray-400">{offer.unit}</p>
            </div>
          </div>
        </div>
      </div>

      {/* progress */}
      <div className="px-4 pb-2">
        <div className="flex justify-between items-center mb-1">
          <p className="text-xs text-gray-500">{progress.current.toLocaleString("pt-BR")} / {progress.target.toLocaleString("pt-BR")} {offer.unit}</p>
          <p className="text-xs font-bold text-orange-500">{pct}%</p>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <OfferCountdown deadline={offer.deadline} compact />
        </div>
        {session ? (
          <Link
            to={`/ofertas/${offer.id}`}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-1.5 rounded-xl transition-colors"
          >
            Participar
          </Link>
        ) : (
          <Link
            to="/login"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-1.5 rounded-xl transition-colors"
          >
            Ver oferta
          </Link>
        )}
      </div>
    </div>
  );
}
