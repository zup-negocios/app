import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { Zap, Users, ShoppingCart, TrendingUp, CheckCircle, Package, ChevronRight } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency, getCurrentCollectivePrice, getMarketPrice, offerProgress } from "../utils/business";
import type { Reservation, MarketOrder } from "../types";

function MiniProgress({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(percent, 100)}%` }} />
    </div>
  );
}

const reservationDoneStatuses = ["venda_concluida", "entregue", "confirmado"];
const marketOrderDoneStatuses = ["venda_concluida"];
const ongoingStatuses = ["reservado", "aguardando_meta", "em_andamento", "meta_atingida", "meta_batida"];
const marketActiveStatuses = ["ordem_gerada", "fornecedor_notificado", "em_tratativa_com_fornecedor"];

export function BuyerDashboardPage() {
  const { session, buyers, offers, reservations, marketOrders } = useAppState();
  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const buyer = buyers.find(b => b.id === session.id);
  const myReservations = reservations.filter(r => r.buyerId === session.id);
  const myMarketOrders = marketOrders.filter(o => o.buyerId === session.id);

  const activeReservations = myReservations.filter(r => ongoingStatuses.includes(r.status));
  const activeMarketOrders = myMarketOrders.filter(o => marketActiveStatuses.includes(o.status));
  const collectiveReservations = myReservations.filter(r => r.purchaseMode === "collective");

  const economy = myReservations.reduce((acc, r) => {
    const offer = offers.find(o => o.id === r.offerId);
    return offer ? acc + r.quantity * (offer.normalPrice - r.unitPrice) : acc;
  }, 0);

  const completedCount =
    myReservations.filter(r => reservationDoneStatuses.includes(r.status)).length +
    myMarketOrders.filter(o => marketOrderDoneStatuses.includes(o.status)).length;

  const recentPurchases = useMemo(() => {
    const combined: Array<
      { type: "collective"; item: Reservation; date: string } |
      { type: "market"; item: MarketOrder; date: string }
    > = [
      ...myReservations.map(r => ({ type: "collective" as const, item: r, date: r.createdAt })),
      ...myMarketOrders.map(o => ({ type: "market" as const, item: o, date: o.createdAt })),
    ];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  }, [myReservations, myMarketOrders]);

  const activeOffers = useMemo(
    () => offers.filter(o => o.approved && ["ativa", "meta_atingida", "aberta"].includes(o.status)).slice(0, 3),
    [offers],
  );

  const marketStatusColors: Record<string, string> = {
    ordem_gerada: "bg-yellow-100 text-yellow-700",
    fornecedor_notificado: "bg-orange-100 text-orange-700",
    em_tratativa_com_fornecedor: "bg-blue-100 text-blue-700",
    venda_concluida: "bg-green-100 text-green-700",
    cancelada: "bg-red-100 text-red-700",
    cliente_nao_cumpriu: "bg-gray-100 text-gray-600",
  };

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-6 max-w-3xl mx-auto pb-24 md:pb-0">

        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Olá, {buyer?.contactName?.split(" ")[0] || "comprador"}!
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {buyer?.companyName}{buyer?.segment ? ` · ${buyer.segment}` : ""}
          </p>
        </div>

        {/* 5 cards principais */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <ShoppingCart size={14} className="text-orange-400" />
            </div>
            <p className="text-xl font-black text-orange-500">{activeReservations.length + activeMarketOrders.length}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Em andamento</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap size={14} className="text-amber-400" />
            </div>
            <p className="text-xl font-black text-amber-500">{myMarketOrders.length}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Ordens Market</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={14} className="text-blue-400" />
            </div>
            <p className="text-xl font-black text-blue-600">{collectiveReservations.length}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Coletivas</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-green-400" />
            </div>
            <p className="text-lg font-black text-green-600 leading-tight">{currency(economy)}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Economia est.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle size={14} className="text-gray-400" />
            </div>
            <p className="text-xl font-black text-gray-700">{completedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Concluídas</p>
          </div>
        </div>

        {/* Dois cards de atalho grandes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-snug">Market Zuppi</p>
              <p className="text-orange-100 text-sm mt-0.5">Compre agora sem depender de meta</p>
            </div>
            <Link
              to="/comprador/market"
              className="mt-auto bg-white text-orange-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-orange-50 transition-colors text-center"
            >
              Ver ofertas imediatas
            </Link>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white p-5 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-snug">Compra Coletiva</p>
              <p className="text-blue-100 text-sm mt-0.5">Participe da meta e desbloqueie preços melhores</p>
            </div>
            <Link
              to="/comprador/compra-coletiva"
              className="mt-auto bg-white text-blue-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors text-center"
            >
              Entrar nas coletivas
            </Link>
          </div>
        </div>

        {/* Minhas compras em andamento */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-800">Minhas compras em andamento</h2>
            <Link to="/comprador/minhas-compras" className="text-xs text-orange-500 font-semibold flex items-center gap-1">
              Ver todas <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPurchases.map(entry => {
              if (entry.type === "collective") {
                const r = entry.item;
                const offer = offers.find(o => o.id === r.offerId);
                const progress = offer ? offerProgress(offer) : null;
                const currentPrice = offer ? getCurrentCollectivePrice(offer) : r.unitPrice;
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {offer?.imageBase64
                          ? <img src={offer.imageBase64} alt={r.product} className="w-full h-full object-cover" />
                          : <Users size={18} className="text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-gray-800 text-sm truncate">{r.product}</p>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">Coletiva</span>
                        </div>
                        <p className="text-xs text-gray-500">{r.quantity.toLocaleString("pt-BR")} {r.unit} · {currency(currentPrice)}/un</p>
                        {progress && (
                          <div className="mt-2">
                            <MiniProgress percent={progress.percent} />
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {progress.percent}% da meta{offer?.deadline ? ` · prazo ${offer.deadline}` : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              } else {
                const o = entry.item;
                const offer = offers.find(of => of.id === o.offerId);
                return (
                  <div key={o.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {offer?.imageBase64
                          ? <img src={offer.imageBase64} alt={o.product} className="w-full h-full object-cover" />
                          : <Zap size={18} className="text-orange-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-gray-800 text-sm truncate">{o.product}</p>
                          <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full flex-shrink-0">Market</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${marketStatusColors[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {o.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs text-gray-500">{currency(o.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
            {recentPurchases.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
                Você ainda não tem compras em andamento.
              </div>
            )}
          </div>
        </section>

        {/* Ofertas recomendadas */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-800">Ofertas recomendadas</h2>
            <Link to="/ofertas" className="text-xs text-orange-500 font-semibold flex items-center gap-1">
              Ver todas <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {activeOffers.map(offer => {
              const progress = offerProgress(offer);
              const marketPrice = getMarketPrice(offer);
              const collectivePrice = getCurrentCollectivePrice(offer);
              const hasMarket = offer.marketSaleEnabled === true;
              const hasCollective = offer.collectiveSaleEnabled === true;
              return (
                <Link
                  key={offer.id}
                  to={`/ofertas/${offer.id}`}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3 hover:border-orange-200 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {offer.imageBase64
                      ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
                      : <Package size={20} className="text-orange-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{offer.product}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {hasMarket && <span className="text-xs font-semibold text-orange-600">Market: {currency(marketPrice)}</span>}
                      {hasCollective && <span className="text-xs font-semibold text-blue-600">Coletiva: {currency(collectivePrice)}</span>}
                    </div>
                    {hasCollective && (
                      <div className="mt-1.5">
                        <MiniProgress percent={progress.percent} />
                        <p className="text-[11px] text-gray-400 mt-0.5">{progress.percent}% da meta</p>
                      </div>
                    )}
                  </div>
                  <TrendingUp size={16} className="text-gray-300 flex-shrink-0" />
                </Link>
              );
            })}
            {activeOffers.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                Nenhuma oferta disponível no momento.
              </div>
            )}
          </div>
        </section>

      </div>
    </DashboardLayout>
  );
}
