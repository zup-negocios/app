import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Zap, Users, Package } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency, getBestCollectivePrice, getCurrentCollectivePrice, getMarketPrice, offerProgress } from "../utils/business";
import { ProgressBarMeta } from "../components/ProgressBarMeta";

export function BuyerMarketPage() {
  const { session, offers } = useAppState();
  const [search, setSearch] = useState("");

  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const marketOffers = useMemo(
    () => offers.filter(o => o.marketSaleEnabled && o.status === "ativa" && (search === "" || o.product.toLowerCase().includes(search.toLowerCase()) || o.description?.toLowerCase().includes(search.toLowerCase()))),
    [offers, search]
  );

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-5xl space-y-5 pb-24 md:pb-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={20} className="text-orange-500" />
            <h1 className="text-xl font-bold text-gray-800">Market Zuppi</h1>
          </div>
          <p className="text-sm text-gray-400">Compra imediata sem depender de meta coletiva.</p>
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar produtos..."
          className="input-base w-full max-w-xs"
        />

        {marketOffers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Nenhuma oferta Market Zuppi disponível{search ? " para essa busca" : ""}.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketOffers.map(offer => (
              <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
                <div className="h-40 bg-orange-50 flex items-center justify-center overflow-hidden">
                  {offer.imageBase64
                    ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
                    : <Package size={40} className="text-orange-200" />}
                </div>
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight">{offer.product}</h3>
                    <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">⚡ Market</span>
                  </div>
                  {offer.description && <p className="text-xs text-gray-400 line-clamp-2">{offer.description}</p>}
                  <div className="mt-auto pt-2">
                    <p className="text-xl font-black text-orange-600">{currency(getMarketPrice(offer))}<span className="text-xs font-normal text-gray-400">/{offer.unit}</span></p>
                    <p className="text-xs text-gray-400 line-through">{currency(offer.normalPrice)}/{offer.unit}</p>
                    {offer.marketMinimumQuantity && offer.marketMinimumQuantity > 1 && (
                      <p className="text-xs text-gray-400 mt-0.5">Mínimo: {offer.marketMinimumQuantity} {offer.unit}</p>
                    )}
                    <Link to={`/ofertas/${offer.id}?mode=market`} className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors">
                      <Zap size={14} /> Comprar agora
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export function BuyerCollectivePage() {
  const { session, offers } = useAppState();
  const [search, setSearch] = useState("");

  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const collectiveOffers = useMemo(
    () => offers.filter(o => o.collectiveSaleEnabled !== false && o.status === "ativa" && (search === "" || o.product.toLowerCase().includes(search.toLowerCase()) || o.description?.toLowerCase().includes(search.toLowerCase()))),
    [offers, search]
  );

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-5xl space-y-5 pb-24 md:pb-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-blue-500" />
            <h1 className="text-xl font-bold text-gray-800">Compra Coletiva</h1>
          </div>
          <p className="text-sm text-gray-400">Participe de compras coletivas — quanto mais compradores, menor o preço para todos.</p>
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar produtos..."
          className="input-base w-full max-w-xs"
        />

        {collectiveOffers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Nenhuma oferta coletiva disponível{search ? " para essa busca" : ""}.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collectiveOffers.map(offer => {
              const progress = offerProgress(offer);
              const currentPrice = getCurrentCollectivePrice(offer);
              const bestPrice = getBestCollectivePrice(offer);
              return (
                <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
                  <div className="h-40 bg-blue-50 flex items-center justify-center overflow-hidden">
                    {offer.imageBase64
                      ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
                      : <Package size={40} className="text-blue-200" />}
                  </div>
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-800 text-sm leading-tight">{offer.product}</h3>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap">👥 Coletiva</span>
                    </div>
                    {offer.description && <p className="text-xs text-gray-400 line-clamp-1">{offer.description}</p>}

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Meta: {progress.percent}%</span>
                        {offer.deadline && <span className="text-gray-400">{new Date(offer.deadline) > new Date() ? `Prazo: ${new Date(offer.deadline).toLocaleDateString("pt-BR")}` : "Encerrada"}</span>}
                      </div>
                      <ProgressBarMeta current={progress.current} total={progress.target} />
                    </div>

                    <div className="mt-auto pt-1">
                      <p className="text-xl font-black text-blue-600">{currency(currentPrice)}<span className="text-xs font-normal text-gray-400">/{offer.unit} atual</span></p>
                      {bestPrice < currentPrice && (
                        <p className="text-xs text-green-600 font-medium">Melhor preço possível: {currency(bestPrice)}/{offer.unit}</p>
                      )}
                      <Link to={`/ofertas/${offer.id}?mode=collective`} className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold transition-colors">
                        <Users size={14} /> Participar
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
