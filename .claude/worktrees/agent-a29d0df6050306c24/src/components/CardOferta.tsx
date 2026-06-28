import { Link } from "react-router-dom";
import type { Offer } from "../types";
import { useAppState } from "./AppProvider";
import { currency, getBestCollectivePrice, getCurrentCollectivePrice, getMarketPrice, getNextTier, offerProgress } from "../utils/business";
import { OfferCountdown } from "./OfferCountdown";
import { Package, Zap, Users } from "lucide-react";

export function CardOferta({ offer }: { offer: Offer }) {
  const { session } = useAppState();
  const progress = offerProgress(offer);
  const pct = Math.min(100, Math.round((progress.current / progress.target) * 100));

  const marketPrice = getMarketPrice(offer);
  const currentCollective = getCurrentCollectivePrice(offer);
  const bestCollective = getBestCollectivePrice(offer);
  const nextTier = getNextTier(offer);

  const hasMarket = offer.marketSaleEnabled;
  const hasCollective = offer.collectiveSaleEnabled !== false; // default true
  const hasTiers = offer.progressiveTiers && offer.progressiveTiers.length > 0;

  const marketDiscount = Math.round(((offer.normalPrice - marketPrice) / offer.normalPrice) * 100);
  const bestDiscount = Math.round(((offer.normalPrice - bestCollective) / offer.normalPrice) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex gap-3 p-4">
        {/* Image */}
        <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {offer.imageBase64
            ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
            : <Package size={32} className="text-orange-300" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 leading-tight truncate">{offer.product}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{offer.brand} · {offer.category}</p>
            </div>
            {bestDiscount > 0 && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                até -{bestDiscount}%
              </span>
            )}
          </div>

          {/* Preços */}
          <div className="flex items-end gap-3 mt-2 flex-wrap">
            {hasMarket && (
              <div>
                <div className="flex items-center gap-1">
                  <Zap size={10} className="text-orange-400" />
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Market</p>
                </div>
                <p className="text-sm font-black text-orange-600">{currency(marketPrice)}<span className="text-xs font-normal text-gray-400">/{offer.unit}</span></p>
                {marketDiscount > 0 && <p className="text-[10px] text-gray-400 line-through">{currency(offer.normalPrice)}/{offer.unit}</p>}
              </div>
            )}
            {hasCollective && hasTiers && (
              <div>
                <div className="flex items-center gap-1">
                  <Users size={10} className="text-blue-400" />
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Coletivo</p>
                </div>
                <p className="text-sm font-black text-blue-600">{currency(currentCollective)}<span className="text-xs font-normal text-gray-400">/{offer.unit}</span></p>
                <p className="text-[10px] text-gray-400">Melhor: {currency(bestCollective)}/{offer.unit}</p>
              </div>
            )}
            {!hasMarket && !hasTiers && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium">Preço Zuppi</p>
                <p className="text-base font-black text-gray-800">{currency(offer.zuppiPrice)}<span className="text-xs font-normal text-gray-400">/{offer.unit}</span></p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progresso coletivo */}
      {hasCollective && (
        <div className="px-4 pb-2">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-gray-500">{pct}% da meta</p>
              {nextTier && (
                <span className="text-[10px] text-blue-500 font-medium">
                  · próxima: {nextTier.percentage}% = {currency(nextTier.price)}
                </span>
              )}
            </div>
            <OfferCountdown deadline={offer.deadline} compact />
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-50">
        {hasMarket && session?.role === "buyer" && (
          <Link
            to={`/ofertas/${offer.id}?mode=market`}
            className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
          >
            <Zap size={12} /> Comprar agora
          </Link>
        )}
        {hasCollective && (
          <Link
            to={`/ofertas/${offer.id}${hasMarket ? "?mode=collective" : ""}`}
            className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
              hasMarket
                ? "border border-blue-200 text-blue-600 hover:bg-blue-50"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            <Users size={12} /> {hasMarket ? "Participar" : session ? "Ver oferta" : "Ver oferta"}
          </Link>
        )}
        {!session && (
          <Link to="/login" className="ml-auto text-xs text-orange-600 font-semibold hover:underline">
            Entrar para comprar
          </Link>
        )}
      </div>
    </div>
  );
}
