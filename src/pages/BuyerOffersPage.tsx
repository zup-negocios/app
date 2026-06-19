import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Zap, Users, Package, Search, SlidersHorizontal, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import {
  currency, getBestCollectivePrice, getCurrentCollectivePrice,
  getMarketPrice, offerProgress,
} from "../utils/business";
import { ProgressBarMeta } from "../components/ProgressBarMeta";

// ─── MARKET ZUPPI ────────────────────────────────────────────────────────────

export function BuyerMarketPage() {
  const { session, offers } = useAppState();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todas");
  const [sortBy, setSortBy] = useState<"relevancia" | "menor_preco" | "maior_desconto">("relevancia");

  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const marketOffers = useMemo(() => {
    let list = offers.filter(o => o.marketSaleEnabled && o.status === "ativa");
    if (search) list = list.filter(o =>
      o.product.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase()) ||
      o.brand?.toLowerCase().includes(search.toLowerCase())
    );
    if (catFilter !== "Todas") list = list.filter(o => o.category === catFilter);
    if (sortBy === "menor_preco") list = [...list].sort((a, b) => getMarketPrice(a) - getMarketPrice(b));
    if (sortBy === "maior_desconto") list = [...list].sort((a, b) => {
      const discA = (a.normalPrice - getMarketPrice(a)) / a.normalPrice;
      const discB = (b.normalPrice - getMarketPrice(b)) / b.normalPrice;
      return discB - discA;
    });
    return list;
  }, [offers, search, catFilter, sortBy]);

  const availableCats = useMemo(() => {
    const cats = new Set(offers.filter(o => o.marketSaleEnabled && o.status === "ativa").map(o => o.category));
    return ["Todas", ...Array.from(cats)];
  }, [offers]);

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-6xl space-y-5 pb-24 md:pb-0">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                <Zap size={18} className="text-orange-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Market Zuppi</h1>
            </div>
            <p className="text-sm text-gray-400 mt-1 ml-11">Compre agora sem depender de meta. Preço fixo, entrega rápida.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
            <Zap size={13} className="text-orange-400" />
            <span><b className="text-orange-600">{marketOffers.length}</b> oferta{marketOffers.length !== 1 ? "s" : ""} disponível{marketOffers.length !== 1 ? "is" : ""}</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produtos, marcas..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          {/* Categorias + Ordenação */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
              {availableCats.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex-shrink-0 ${catFilter === cat ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-200"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <SlidersHorizontal size={13} className="text-gray-400" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-orange-300">
                <option value="relevancia">Relevância</option>
                <option value="menor_preco">Menor preço</option>
                <option value="maior_desconto">Maior desconto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de ofertas */}
        {marketOffers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-500">Nenhuma oferta encontrada</p>
            <p className="text-sm text-gray-400 mt-1">{search || catFilter !== "Todas" ? "Tente outros filtros." : "Novas ofertas chegam em breve."}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {marketOffers.map(offer => {
              const marketPrice = getMarketPrice(offer);
              const discount = Math.round((1 - marketPrice / offer.normalPrice) * 100);
              return (
                <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md overflow-hidden flex flex-col transition-all duration-200">
                  {/* Imagem */}
                  <div className="relative h-44 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {offer.imageBase64
                      ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
                      : <Package size={48} className="text-orange-200" />}
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                        -{discount}%
                      </span>
                    )}
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-orange-600 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      <Zap size={10} /> Market
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">{offer.brand} · {offer.category}</p>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug mt-0.5">{offer.product}</h3>
                      {offer.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{offer.description}</p>}
                    </div>

                    {/* Preço */}
                    <div className="mt-auto">
                      <div className="flex items-end gap-2">
                        <p className="text-2xl font-black text-orange-600">{currency(marketPrice)}</p>
                        <p className="text-xs text-gray-400 mb-0.5">/{offer.unit}</p>
                      </div>
                      {discount > 0 && (
                        <p className="text-xs text-gray-400 line-through">{currency(offer.normalPrice)}/{offer.unit}</p>
                      )}

                      {/* Detalhes rápidos */}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        {offer.marketMinimumQuantity && offer.marketMinimumQuantity > 1 && (
                          <span>Mín. {offer.marketMinimumQuantity} {offer.unit}</span>
                        )}
                        {offer.deliveryTime && (
                          <span className="flex items-center gap-0.5"><Clock size={10} /> {offer.deliveryTime}</span>
                        )}
                        {offer.region && <span>{offer.region}</span>}
                      </div>

                      {/* Condição de pagamento */}
                      {offer.paymentTerms && (
                        <p className="text-[10px] text-gray-400 mt-1 truncate">{offer.paymentTerms}</p>
                      )}

                      <Link
                        to={`/ofertas/${offer.id}?mode=market`}
                        className="mt-3 flex items-center justify-center gap-1.5 w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors"
                      >
                        <Zap size={14} /> Comprar agora
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

// ─── COMPRA COLETIVA ─────────────────────────────────────────────────────────

export function BuyerCollectivePage() {
  const { session, offers, reservations } = useAppState();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todas");
  const [sortBy, setSortBy] = useState<"relevancia" | "maior_progresso" | "menor_preco" | "prazo">("relevancia");
  const [showOnlyJoined, setShowOnlyJoined] = useState(false);

  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const myIntentOfferIds = useMemo(() =>
    new Set(reservations.filter(r => r.buyerId === session.id && r.purchaseMode === "collective").map(r => r.offerId)),
    [reservations, session.id]
  );

  const collectiveOffers = useMemo(() => {
    let list = offers.filter(o => o.collectiveSaleEnabled !== false && o.status === "ativa");
    if (search) list = list.filter(o =>
      o.product.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase()) ||
      o.brand?.toLowerCase().includes(search.toLowerCase())
    );
    if (catFilter !== "Todas") list = list.filter(o => o.category === catFilter);
    if (showOnlyJoined) list = list.filter(o => myIntentOfferIds.has(o.id));
    if (sortBy === "maior_progresso") list = [...list].sort((a, b) => offerProgress(b).percent - offerProgress(a).percent);
    if (sortBy === "menor_preco") list = [...list].sort((a, b) => getCurrentCollectivePrice(a) - getCurrentCollectivePrice(b));
    if (sortBy === "prazo") list = [...list].sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
    return list;
  }, [offers, search, catFilter, sortBy, showOnlyJoined, myIntentOfferIds]);

  const availableCats = useMemo(() => {
    const cats = new Set(offers.filter(o => o.collectiveSaleEnabled !== false && o.status === "ativa").map(o => o.category));
    return ["Todas", ...Array.from(cats)];
  }, [offers]);

  function daysLeft(deadline?: string) {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return diff > 0 ? diff : 0;
  }

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-6xl space-y-5 pb-24 md:pb-0">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users size={18} className="text-blue-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Compra Coletiva</h1>
            </div>
            <p className="text-sm text-gray-400 mt-1 ml-11">Quanto mais compradores, menor o preço. Participe da meta e desbloqueie faixas progressivas.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
            <Users size={13} className="text-blue-400" />
            <span><b className="text-blue-600">{collectiveOffers.length}</b> coletiva{collectiveOffers.length !== 1 ? "s" : ""} ativa{collectiveOffers.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Banner explicativo */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-bold text-base">Como funciona a Compra Coletiva?</p>
            <p className="text-sm text-blue-100 mt-1">Registre sua intenção de compra. Quando a meta é atingida, o preço cai para todos. Quanto mais gente, melhor o preço.</p>
          </div>
          <div className="flex gap-3 text-center flex-shrink-0">
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-lg font-black">1.</p>
              <p className="text-xs text-blue-100">Registre<br/>intenção</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-lg font-black">2.</p>
              <p className="text-xs text-blue-100">Meta é<br/>atingida</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <p className="text-lg font-black">3.</p>
              <p className="text-xs text-blue-100">Preço cai<br/>para todos</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex gap-2">
            {/* Busca */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar produtos, marcas..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* Só minhas */}
            <button
              onClick={() => setShowOnlyJoined(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex-shrink-0 ${showOnlyJoined ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-200"}`}
            >
              <Users size={12} /> Participo
            </button>
          </div>
          {/* Categorias + Ordenação */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
              {availableCats.map(cat => (
                <button key={cat} onClick={() => setCatFilter(cat)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex-shrink-0 ${catFilter === cat ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-200"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <SlidersHorizontal size={13} className="text-gray-400" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-blue-300">
                <option value="relevancia">Relevância</option>
                <option value="maior_progresso">Mais próximo da meta</option>
                <option value="menor_preco">Menor preço atual</option>
                <option value="prazo">Prazo mais próximo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de ofertas */}
        {collectiveOffers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Users size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="font-medium text-gray-500">Nenhuma coletiva encontrada</p>
            <p className="text-sm text-gray-400 mt-1">{search || catFilter !== "Todas" ? "Tente outros filtros." : "Novas coletivas chegam em breve."}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collectiveOffers.map(offer => {
              const progress = offerProgress(offer);
              const currentPrice = getCurrentCollectivePrice(offer);
              const bestPrice = getBestCollectivePrice(offer);
              const days = daysLeft(offer.deadline);
              const isJoined = myIntentOfferIds.has(offer.id);
              const hasTiers = (offer.progressiveTiers?.length ?? 0) > 0;
              const discount = Math.round((1 - currentPrice / offer.normalPrice) * 100);

              return (
                <div key={offer.id} className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md ${isJoined ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-100 hover:border-blue-200"}`}>
                  {/* Imagem */}
                  <div className="relative h-44 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {offer.imageBase64
                      ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
                      : <Package size={48} className="text-blue-200" />}
                    {isJoined && (
                      <span className="absolute top-3 left-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                        ✓ Participando
                      </span>
                    )}
                    {days !== null && days <= 5 && !isJoined && (
                      <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <Clock size={9} /> {days}d restantes
                      </span>
                    )}
                    <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-blue-600 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                      <Users size={10} /> Coletiva
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">{offer.brand} · {offer.category}</p>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug mt-0.5">{offer.product}</h3>
                      {offer.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{offer.description}</p>}
                    </div>

                    {/* Progresso da meta */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-600">Meta: <span className={`${progress.percent >= 75 ? "text-green-600" : progress.percent >= 50 ? "text-blue-600" : "text-orange-500"}`}>{progress.percent}%</span></span>
                        {days !== null && (
                          <span className={`flex items-center gap-0.5 ${days <= 3 ? "text-red-500" : "text-gray-400"}`}>
                            <Clock size={10} /> {days}d
                          </span>
                        )}
                      </div>
                      <ProgressBarMeta current={progress.current} total={progress.target} />
                    </div>

                    {/* Faixas progressivas resumidas */}
                    {hasTiers && offer.progressiveTiers && (
                      <div className="grid grid-cols-2 gap-1">
                        {offer.progressiveTiers.slice(0, 4).map(tier => {
                          const active = currentPrice === tier.price;
                          return (
                            <div key={tier.percentage} className={`rounded-lg px-2 py-1.5 text-center ${active ? "bg-blue-100 border border-blue-200" : "bg-gray-50"}`}>
                              <p className={`text-[10px] font-bold ${active ? "text-blue-700" : "text-gray-500"}`}>{tier.percentage}%</p>
                              <p className={`text-xs font-black ${active ? "text-blue-600" : "text-gray-600"}`}>{currency(tier.price)}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Preço */}
                    <div className="mt-auto">
                      <div className="flex items-end gap-2">
                        <p className="text-2xl font-black text-blue-600">{currency(currentPrice)}</p>
                        <p className="text-xs text-gray-400 mb-0.5">/{offer.unit} atual</p>
                      </div>
                      <div className="flex items-center justify-between">
                        {discount > 0 && <p className="text-xs text-gray-400 line-through">{currency(offer.normalPrice)}/{offer.unit}</p>}
                        {bestPrice < currentPrice && (
                          <p className="text-xs text-green-600 font-semibold flex items-center gap-0.5">
                            <TrendingUp size={10} /> Até {currency(bestPrice)} se 100%
                          </p>
                        )}
                      </div>

                      <Link
                        to={`/ofertas/${offer.id}?mode=collective`}
                        className={`mt-3 flex items-center justify-center gap-1.5 w-full py-3 rounded-xl text-sm font-bold transition-colors ${isJoined ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                      >
                        {isJoined ? <><ChevronRight size={14} /> Ver minha intenção</> : <><Users size={14} /> Participar da coletiva</>}
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
