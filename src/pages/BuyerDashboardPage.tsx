import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { CardOferta } from "../components/CardOferta";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency, offerProgress } from "../utils/business";
import { ChevronRight, Package } from "lucide-react";

const ongoingStatuses = ["reservado", "aguardando_meta", "em_andamento", "meta_atingida", "meta_batida"];

export function BuyerDashboardPage() {
  const { session, buyers, offers, reservations, categories } = useAppState();
  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;
  const buyer = buyers.find(b => b.id === session.id);

  const activeOffers = offers.filter(o => o.approved && ["ativa", "meta_atingida", "aberta"].includes(o.status));

  const highlighted = useMemo(
    () => activeOffers.sort((a, b) => (b.reservedQty / b.minGoal) - (a.reservedQty / a.minGoal)).slice(0, 4),
    [activeOffers],
  );

  const myReservations = reservations.filter(r => r.buyerId === session.id);
  const activeReservations = myReservations.filter(r => ongoingStatuses.includes(r.status));
  const totalReserved = myReservations.reduce((a, r) => a + r.totalAmount, 0);
  const economy = myReservations.reduce((acc, r) => {
    const offer = offers.find(o => o.id === r.offerId);
    return offer ? acc + r.quantity * (offer.normalPrice - r.unitPrice) : acc;
  }, 0);
  const nearGoal = activeReservations.filter(r => {
    const offer = offers.find(o => o.id === r.offerId);
    return offer && offerProgress(offer).percent >= 70 && offerProgress(offer).percent < 100;
  }).length;

  const recentPurchases = [...myReservations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const CATEGORY_ICONS: Record<string, string> = {
    alimentos: "🥗", bebidas: "🥤", limpeza: "🧹", higiene: "🧴",
    construção: "🔨", construcao: "🔨", petshop: "🐾", farmacia: "💊",
    padaria: "🍞", restaurante: "🍽️", outro: "📦",
  };

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-5 max-w-2xl mx-auto">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Olá, {buyer?.contactName?.split(" ")[0] || "comprador"}! 👋
          </h1>
        </div>

        {/* Promo banner */}
        <div className="rounded-2xl bg-gray-900 text-white p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold leading-snug">Participe de compras coletivas<br />e desbloqueie preços melhores!</p>
          </div>
          <Link
            to="/ofertas"
            className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            Ver compras
          </Link>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-xl font-black text-orange-500">{activeReservations.length}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">reservas ativas</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-xl font-black text-blue-600">{currency(totalReserved)}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">valor reservado</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-xl font-black text-green-600">{currency(economy)}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">economia estimada</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-xl font-black text-amber-600">{nearGoal}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">metas perto de bater</p>
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-800">Categorias</h2>
            <Link to="/ofertas" className="text-xs text-orange-500 font-semibold">Ver todas</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {categories.filter(c => c.active).sort((a, b) => a.order - b.order).slice(0, 7).map(c => (
              <Link
                key={c.id}
                to={`/ofertas?cat=${c.id}`}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl border border-orange-100 hover:bg-orange-100 transition-colors">
                  {CATEGORY_ICONS[c.name.toLowerCase()] || "📦"}
                </div>
                <p className="text-[11px] font-medium text-gray-600 text-center w-14 leading-tight">{c.name}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* My purchases in progress */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-800">Minhas compras em andamento</h2>
            <Link to="/comprador/minhas-compras" className="text-xs text-orange-500 font-semibold flex items-center gap-1">
              Ver todas <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPurchases.map(r => {
              const offer = offers.find(o => o.id === r.offerId);
              const progress = offer ? offerProgress(offer) : null;
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {offer?.imageBase64
                      ? <img src={offer.imageBase64} alt={r.product} className="w-full h-full object-cover" />
                      : <Package size={20} className="text-orange-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{r.product}</p>
                    <p className="text-xs text-gray-500">{r.quantity.toLocaleString("pt-BR")} {r.unit} · {currency(r.totalAmount)}</p>
                    {progress && <p className="text-xs text-orange-500 font-medium mt-0.5">{progress.percent}% da meta</p>}
                  </div>
                  <Link to={`/comprador/minhas-compras/${r.id}`} className="text-xs font-semibold text-orange-600 hover:underline flex-shrink-0">
                    Ver detalhes
                  </Link>
                </div>
              );
            })}
            {recentPurchases.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
                Você ainda não reservou nenhuma oferta.
              </div>
            )}
          </div>
        </section>

        {/* Recommended offers */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-800">Ofertas recomendadas para você</h2>
            <Link to="/ofertas" className="text-xs text-orange-500 font-semibold flex items-center gap-1">
              Ver todas <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {highlighted.map(offer => <CardOferta key={offer.id} offer={offer} />)}
          </div>
          {highlighted.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
              Nenhuma oferta disponível no momento.
            </div>
          )}
        </section>

      </div>
    </DashboardLayout>
  );
}
