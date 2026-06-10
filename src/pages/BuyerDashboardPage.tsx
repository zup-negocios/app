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

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-6 max-w-6xl">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 text-white p-6">
          <h1 className="text-2xl font-bold">Olá, {buyer?.contactName?.split(" ")[0] || "comprador"}!</h1>
          <p className="text-gray-300 mt-1">Compre junto. Pague menos. Todo mundo ganha.</p>
        </div>

        {/* Metrics */}
        <div className="grid sm:grid-cols-3 gap-4">
          <MetricCard title="Ofertas abertas" value={String(activeOffers.length)} sub="disponíveis agora" icon={Tag} />
          <MetricCard title="Minhas reservas" value={String(myReservations.length)} sub={`${metaBatida} meta(s) atingida(s)`} icon={ShoppingCart} iconBg="bg-green-50" iconColor="text-green-600" />
          <MetricCard title="Total reservado" value={currency(totalSpent)} sub="valor potencial" icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" />
        </div>

        {/* Categories */}
        <div className="card p-4">
          <h2 className="font-bold text-gray-800 mb-3">Explorar por categoria</h2>
          <div className="flex flex-wrap gap-2">
            {categories.filter(c => c.active).sort((a, b) => a.order - b.order).map(c => (
              <Link
                key={c.id}
                to={`/ofertas?cat=${c.id}`}
                className="px-3 py-1.5 rounded-xl bg-gray-50 text-sm font-medium text-gray-600 hover:bg-orange-50 hover:text-orange-700 border border-gray-100 hover:border-orange-200 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Highlighted offers */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-800">Ofertas em destaque</h2>
            <Link to="/ofertas" className="text-sm text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1">
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid xl:grid-cols-2 gap-4">
            {highlighted.map(offer => <CardOferta key={offer.id} offer={offer} />)}
          </div>
          {highlighted.length === 0 && (
            <div className="card p-8 text-center text-gray-400">
              Nenhuma oferta disponível no momento. Verifique novamente em breve.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
