import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { CardOferta } from "../components/CardOferta";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency } from "../utils/business";
import { Tag, ShoppingCart, TrendingUp, ChevronRight } from "lucide-react";

function MetricCard({ title, value, sub, icon: Icon, iconBg = "bg-orange-50", iconColor = "text-orange-500" }: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

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
  const metaBatida = myReservations.filter(r => ["meta_batida", "confirmado", "meta_atingida"].includes(r.status)).length;
  const totalSpent = myReservations.reduce((a, r) => a + r.totalAmount, 0);

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
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-orange-500">{activeOffers.length}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">ofertas abertas</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-green-600">{myReservations.length}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">minhas reservas</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-blue-600">{metaBatida}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">metas atingidas</p>
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

        {/* Highlighted offers */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-gray-800">Compras em destaque</h2>
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
