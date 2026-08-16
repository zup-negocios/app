import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { Offer } from "../types";
import toast from "react-hot-toast";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import {
  currency, formatGoal, maxEditDeadlineInputValue, maxOfferDeadlineInputValue, offerAvailability,
  offerProgress, parseDecimal, todayInputValue,
} from "../utils/business";
import {
  TrendingUp, Users, DollarSign, Package, PlusCircle, Eye,
  FileText, Sparkles,
  AlertCircle, Calendar, MapPin, CreditCard, Truck, CheckCircle,
  Lock, Crown, ExternalLink, ImagePlus, X,
} from "lucide-react";

const reservationLabel: Record<string, string> = {
  reservado: "Reservado",
  aguardando_meta: "Aguardando meta",
  meta_atingida: "Meta atingida",
  confirmado: "Confirmado",
  entregue: "Entregue",
  cancelado: "Cancelado",
  em_andamento: "Em andamento",
  meta_batida: "Meta batida",
};

const statusColors: Record<string, string> = {
  ativa: "badge-ativa",
  aberta: "badge-ativa",
  rascunho: "badge-rascunho",
  meta_atingida: "badge-meta_atingida",
  cancelada: "badge-cancelada",
  aguardando_aprovacao: "badge-aguardando_aprovacao",
  pausada: "badge-pausada",
};

function MetricCard({ title, value, sub, icon: Icon }: {
  title: string; value: string; sub?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          <Icon size={16} className="text-gray-400" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{title}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export function SupplierDashboardPage() {
  const { session, suppliers, offers, reservations, marketOrders } = useAppState();
  const navigate = useNavigate();
  const [dashMonth, setDashMonth] = useState("all");

  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const supplier = suppliers.find(s => s.id === session.id);
  const myOffers = offers.filter(o => o.supplierId === session.id);
  const myOfferIds = new Set(myOffers.map(o => o.id));

  const allMyReservations = reservations.filter(r => myOfferIds.has(r.offerId));
  const allMyMarketOrders = marketOrders.filter(o => myOfferIds.has(o.offerId));

  const myReservations = dashMonth === "all"
    ? allMyReservations
    : allMyReservations.filter(r => r.createdAt.startsWith(dashMonth));
  const myMarketOrders = dashMonth === "all"
    ? allMyMarketOrders
    : allMyMarketOrders.filter(o => o.createdAt.startsWith(dashMonth));

  const activeOffersCount = myOffers.filter(o => ["ativa", "aberta"].includes(o.status)).length;
  const reachedOffers = myOffers.filter(o => o.status === "meta_atingida").length;
  const totalReservedAmount = myReservations.reduce((a, r) => a + r.totalAmount, 0);
  const marketOrdersValue = myMarketOrders.reduce((a, o) => a + o.totalAmount, 0);
  const collectiveReservations = myReservations.filter(r => r.purchaseMode === "collective");
  const concludedReservations = allMyReservations.filter(r => r.status === "venda_concluida");
  const concludedMarket = allMyMarketOrders.filter(o => o.status === "venda_concluida");
  const concludedCount = concludedReservations.length + concludedMarket.length;
  const potentialValue = totalReservedAmount + marketOrdersValue;
  const waiting = myReservations.filter(r => ["aguardando_meta", "em_andamento"].includes(r.status)).length;
  const pendingMarket = myMarketOrders.filter(o => ["ordem_gerada", "fornecedor_notificado"].includes(o.status)).length;
  const marketInNegotiation = myMarketOrders.filter(o => o.status === "em_tratativa_com_fornecedor").length;
  const marketConcluded = myMarketOrders.filter(o => o.status === "venda_concluida").length;

  // Priorities (max 3)
  const priorities = useMemo(() => {
    const items: { id: string; text: string; cta: string; href: string }[] = [];
    const sortedByProgress = [...myOffers]
      .filter(o => ["ativa", "aberta"].includes(o.status))
      .map(o => ({ offer: o, progress: offerProgress(o) }))
      .sort((a, b) => b.progress.percent - a.progress.percent);

    for (const { offer, progress } of sortedByProgress) {
      if (items.length >= 2) break;
      if (progress.percent >= 75 && progress.percent < 100) {
        const missingLabel = offer.targetType === "amount"
          ? currency(progress.missing)
          : `${progress.missing.toLocaleString("pt-BR")} ${offer.unit}`;
        items.push({ id: offer.id, text: `${offer.product} está com ${progress.percent}% da meta. Faltam ${missingLabel}.`, cta: "Ver oferta", href: `/fornecedor/ofertas/${offer.id}` });
      }
    }
    if (pendingMarket > 0 && items.length < 3) {
      items.push({ id: "pending-market", text: `${pendingMarket} ordem(s) Market aguardando resposta.`, cta: "Ver pedidos", href: "/fornecedor/pedidos" });
    }
    const lowTraction = sortedByProgress.find(({ progress }) => progress.percent < 25);
    if (lowTraction && items.length < 3) {
      items.push({ id: `low-${lowTraction.offer.id}`, text: `${lowTraction.offer.product} tem baixa tração. Revise preço, foto ou prazo.`, cta: "Editar oferta", href: `/fornecedor/ofertas/${lowTraction.offer.id}?edit=1` });
    }
    if (waiting > 0 && items.length < 3) {
      items.push({ id: "waiting", text: `Você recebeu ${waiting} pedido(s) aguardando meta.`, cta: "Ver pedidos", href: "/fornecedor/pedidos" });
    }
    return items.slice(0, 3);
  }, [myOffers, waiting, pendingMarket]);

  const recentOffers = myOffers.slice(0, 5);

  // Recent orders: mix market + collective, last 5
  const recentOrders = useMemo(() => {
    const collective = myReservations
      .filter(r => r.purchaseMode === "collective")
      .map(r => ({ type: "collective" as const, item: r, date: r.createdAt }));
    const market = myMarketOrders
      .map(o => ({ type: "market" as const, item: o, date: o.createdAt }));
    return [...collective, ...market]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [myReservations, myMarketOrders]);

  const reservationStatusColors: Record<string, string> = {
    reservado: "bg-blue-100 text-blue-700",
    aguardando_meta: "bg-yellow-100 text-yellow-700",
    em_andamento: "bg-yellow-100 text-yellow-700",
    meta_atingida: "bg-green-100 text-green-700",
    meta_batida: "bg-green-100 text-green-700",
    confirmado: "bg-green-100 text-green-700",
    entregue: "bg-gray-100 text-gray-600",
    venda_concluida: "bg-emerald-100 text-emerald-700",
    cancelado: "bg-red-100 text-red-700",
  };
  const marketStatusColors: Record<string, string> = {
    ordem_gerada: "bg-yellow-100 text-yellow-700",
    fornecedor_notificado: "bg-orange-100 text-orange-700",
    em_tratativa_com_fornecedor: "bg-blue-100 text-blue-700",
    venda_concluida: "bg-emerald-100 text-emerald-700",
    cancelada: "bg-red-100 text-red-700",
    cliente_nao_cumpriu: "bg-gray-100 text-gray-600",
  };

  const planoLabel = supplier?.planoFornecedor === "assinante" ? "Assinante" : "Gratuito";

  return (
    <DashboardLayout role="supplier">
      <div className="space-y-6 max-w-6xl pb-24 md:pb-0">

        {/* Cabeçalho executivo */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Olá, {supplier?.contactName?.split(" ")[0] || "fornecedor"}!
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {supplier?.companyName} · Plano <span className="font-semibold text-gray-600">{planoLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={dashMonth}
              onChange={e => setDashMonth(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white"
            >
              {getMonthOptions().map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={() => navigate("/fornecedor/criar-oferta")}>
              <PlusCircle size={16} /> Nova oferta
            </button>
          </div>
        </div>

        {/* 5 cards principais */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          <MetricCard
            title="Ofertas ativas"
            value={String(activeOffersCount)}
            sub={`${reachedOffers} meta(s) atingida(s)`}
            icon={TrendingUp}
          />
          <MetricCard
            title="Ordens Market"
            value={String(myMarketOrders.length)}
            sub={currency(marketOrdersValue)}
            icon={DollarSign}
          />
          <MetricCard
            title="Coletivas"
            value={String(collectiveReservations.length)}
            sub={currency(totalReservedAmount)}
            icon={Users}
          />
          <MetricCard
            title="Vendas concluídas"
            value={String(concludedCount)}
            sub={`Market + Coletiva`}
            icon={CheckCircle}
          />
          <MetricCard
            title="Valor potencial"
            value={currency(potentialValue)}
            sub="Market + Coletiva"
            icon={TrendingUp}
          />
        </div>

        {/* Alerta market pendente */}
        {pendingMarket > 0 && (
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
            <span className="text-orange-500 font-bold text-sm">⚡</span>
            <p className="text-sm text-orange-700 font-medium">Você tem <b>{pendingMarket}</b> ordem(s) Market aguardando sua atenção.</p>
            <Link to="/fornecedor/pedidos" className="ml-auto text-xs font-bold text-orange-600 hover:underline whitespace-nowrap">Ver agora</Link>
          </div>
        )}

        {/* Prioridades do dia */}
        {priorities.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-700 mb-3">Prioridades do dia</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {priorities.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-600 leading-relaxed">{p.text}</p>
                  </div>
                  <Link to={p.href} className="text-xs font-semibold text-orange-500 hover:text-orange-600 mt-auto">
                    {p.cta} →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Resumo Market × Coletiva */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Market</span>
              <h3 className="font-bold text-gray-700 text-sm">Resumo Market</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Ordens geradas</span><span className="font-semibold text-gray-800">{myMarketOrders.filter(o => o.status === "ordem_gerada").length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Concluídas</span><span className="font-semibold text-green-600">{marketConcluded}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Em negociação</span><span className="font-semibold text-blue-600">{marketInNegotiation}</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-50"><span className="text-gray-500">Valor total</span><span className="font-bold text-orange-600">{currency(marketOrdersValue)}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Coletiva</span>
              <h3 className="font-bold text-gray-700 text-sm">Resumo Coletiva</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Intenções</span><span className="font-semibold text-gray-800">{collectiveReservations.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Metas atingidas</span><span className="font-semibold text-green-600">{reachedOffers}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Aguardando meta</span><span className="font-semibold text-yellow-600">{waiting}</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-50"><span className="text-gray-500">Valor potencial</span><span className="font-bold text-blue-600">{currency(totalReservedAmount)}</span></div>
            </div>
          </div>
        </div>

        {/* Tabela Minhas ofertas */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">Minhas ofertas</h2>
            <Link to="/fornecedor/ofertas" className="text-xs text-orange-500 font-semibold hover:text-orange-600">
              Ver todas
            </Link>
          </div>

          {recentOffers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <Package size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-500">Nenhuma oferta ainda</p>
              <button className="btn-primary mx-auto mt-3" onClick={() => navigate("/fornecedor/criar-oferta")}>
                <PlusCircle size={15} /> Criar oferta
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Produto", "Modalidade", "Status", "Reservado", "Progresso", "Prazo", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOffers.map(offer => {
                    const progress = offerProgress(offer);
                    const offerRes = allMyReservations.filter(r => r.offerId === offer.id);
                    const daysLeft = Math.max(0, Math.ceil((new Date(`${offer.deadline}T23:59:59`).getTime() - Date.now()) / 86400000));
                    const hasMarket = offer.marketSaleEnabled === true;
                    const hasCollective = offer.collectiveSaleEnabled === true;
                    return (
                      <tr key={offer.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {offer.imageBase64
                                ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
                                : <Package size={14} className="text-orange-300" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 truncate">{offer.product}</p>
                              <p className="text-[11px] text-gray-400">{offer.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {hasMarket && <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Market</span>}
                            {hasCollective && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Coletiva</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className={statusColors[offer.status] || "badge-rascunho"}>{offer.status.replace(/_/g, " ")}</span></td>
                        <td className="px-4 py-3 text-gray-700">{currency(offerRes.reduce((a, r) => a + r.totalAmount, 0))}</td>
                        <td className="px-4 py-3">
                          <div className="w-24">
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1">
                              <div className={`h-full rounded-full ${progress.percent >= 100 ? "bg-green-500" : "bg-orange-500"}`} style={{ width: `${Math.min(progress.percent, 100)}%` }} />
                            </div>
                            <span className="text-[11px] text-gray-400">{progress.percent}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{daysLeft}d</td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/fornecedor/ofertas/${offer.id}`} className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400">
                            <Eye size={14} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Pedidos recentes — Market + Coletiva misturados */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">Pedidos recentes</h2>
            <Link to="/fornecedor/pedidos" className="text-xs text-orange-500 font-semibold hover:text-orange-600">
              Ver todos
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              Nenhum pedido recebido ainda.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Cliente", "Tipo", "Produto", "Valor", "Status", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map(entry => {
                    const isCollective = entry.type === "collective";
                    const item = entry.item;
                    const companyName = item.buyerSnapshot.companyName;
                    const city = item.buyerSnapshot.city;
                    const product = item.product;
                    const totalAmount = item.totalAmount;
                    const status = item.status;
                    const statusColor = isCollective
                      ? (reservationStatusColors[status] ?? "bg-gray-100 text-gray-600")
                      : (marketStatusColors[status] ?? "bg-gray-100 text-gray-600");
                    const href = isCollective
                      ? `/fornecedor/pedidos/${item.id}`
                      : `/fornecedor/pedidos/${item.id}`;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{companyName}</p>
                          <p className="text-[11px] text-gray-400">{city}</p>
                        </td>
                        <td className="px-4 py-3">
                          {isCollective
                            ? <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Coletiva</span>
                            : <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Market</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600 truncate max-w-[120px]">{product}</td>
                        <td className="px-4 py-3 font-medium text-gray-700">{currency(totalAmount)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor}`}>
                            {status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={href} className="text-xs font-semibold text-orange-500 hover:text-orange-600">Ver</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

// ─── MARKET INTEL PANEL ───────────────────────────────────────────────────────

export function MarketIntelPanel({ normalPrice }: { normalPrice: number }) {
  const marketMin = 112.00;
  const marketAvg = 118.40;
  const marketMax = 124.90;
  const suggested = 109.90;
  const economy = normalPrice > 0 ? ((normalPrice - suggested) / normalPrice * 100).toFixed(1) : "12.1";

  const sources = [
    { name: "Mercado Livre", price: marketMin },
    { name: "Google Shopping", price: 117.90 },
    { name: "Lojas online", price: marketMax },
  ];
  const maxPrice = Math.max(...sources.map(s => s.price)) * 1.15;

  return (
    <div className="card p-5 space-y-4 h-fit sticky top-[76px]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles size={15} className="text-orange-500" />
            <span className="text-sm font-bold text-gray-800">Inteligência de Mercado</span>
          </div>
          <p className="text-xs text-gray-500">Busca automática no Google e marketplaces</p>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Atualizado agora
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Menor preço online</p>
          <p className="text-xl font-bold text-orange-600">{currency(marketMin)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-1">Origem</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">ML</span>
            <span className="text-xs font-semibold text-gray-700">Mercado Livre</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Preço médio</p>
          <p className="text-lg font-bold text-gray-800">{currency(marketAvg)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Faixa de mercado</p>
          <p className="text-xs font-semibold text-gray-700 mt-1">{currency(marketMin)} a {currency(marketMax)}</p>
        </div>
      </div>

      <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
        <p className="text-xs text-gray-500 mb-0.5">Preço sugerido Zup</p>
        <div className="flex items-end justify-between gap-2">
          <p className="text-2xl font-bold text-orange-600">{currency(suggested)}</p>
          <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
            Competitivo ✓
          </span>
        </div>
      </div>

      <div className="bg-green-50 rounded-xl px-3 py-2.5 border border-green-100 flex items-center gap-2">
        <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
        <p className="text-xs font-medium text-green-700">Economia percebida: {economy}% abaixo do preço normal</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 mb-2.5">Comparativo de preços encontrados</p>
        <div className="space-y-2.5">
          {sources.map(s => (
            <div key={s.name} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-[90px] flex-shrink-0 truncate">{s.name}</span>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${(s.price / maxPrice) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-[58px] text-right flex-shrink-0">{currency(s.price)}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        Fontes: resultados de busca no Google, Google Shopping e marketplaces.
        <span className="block mt-0.5 text-amber-500 font-medium">⚠ Dados simulados — preparado para futura API</span>
      </p>
    </div>
  );
}

// ─── PRODUCT IMAGE UPLOAD ──────────────────────────────────────────────────────

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function ProductImageUpload({ value, onChange }: { value: string | null; onChange: (base64: string | null) => void }) {
  const [error, setError] = useState("");

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Formato não suportado. Use PNG, JPG, JPEG ou WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError("Arquivo muito grande. Máximo 5MB. Comprima a imagem.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="card p-5 space-y-3">
      <div>
        <h3 className="font-bold text-gray-800">Foto do produto</h3>
        <p className="text-sm text-gray-500 mt-1">
          Adicione uma imagem do produto para aumentar o interesse dos compradores. Ofertas com foto tendem a gerar mais cliques e reservas.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Formatos: PNG, JPG, JPEG ou WEBP — máximo 5MB. Comprima a imagem se necessário.
        </p>
      </div>

      {value ? (
        <div className="relative w-full h-44 rounded-xl overflow-hidden border border-gray-100">
          <img src={value} alt="Preview do produto" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center"
          >
            <X size={14} className="text-gray-600" />
          </button>
          <label className="absolute bottom-2 right-2 bg-white/90 hover:bg-white shadow text-xs font-semibold text-gray-700 px-3 py-1.5 rounded-lg cursor-pointer">
            Trocar imagem
            <input type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
          </label>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 w-full h-44 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50/30 transition-colors cursor-pointer">
          <ImagePlus size={28} className="text-gray-300" />
          <span className="text-sm font-medium text-gray-500">Clique para enviar uma imagem</span>
          <span className="text-xs text-gray-400">PNG, JPG, JPEG ou WEBP</span>
          <input type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
        </label>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ─── CREATE OFFER ─────────────────────────────────────────────────────────────

type Tier = { percentage: number; price: number };

export function SupplierCreateOfferPage() {
  const { session, addOffer, categories, cities } = useAppState();
  const navigate = useNavigate();
  // Meta de oferta é sempre por quantidade (meta por valor foi removida).
  const targetType = "quantity" as const;
  const [normalPrice, setNormalPrice] = useState(0);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [marketEnabled, setMarketEnabled] = useState(true);
  const [collectiveEnabled, setCollectiveEnabled] = useState(true);
  const [tiers, setTiers] = useState<Tier[]>([
    { percentage: 25, price: 0 },
    { percentage: 50, price: 0 },
    { percentage: 75, price: 0 },
    { percentage: 100, price: 0 },
  ]);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const updateTier = (index: number, field: keyof Tier, value: number) => {
    setTiers(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const addTier = () => setTiers(prev => [...prev, { percentage: 0, price: 0 }]);
  const removeTier = (index: number) => setTiers(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const category = categories.find(c => c.id === String(data.get("categoryId")));
    const city = cities.find(c => c.id === String(data.get("cityId")));
    const deadline = String(data.get("deadline"));
    const targetQuantity = parseDecimal(data.get("targetQuantity"));
    const validTiers = tiers.filter(t => t.percentage > 0 && t.price > 0);
    const collectiveMinQty = parseDecimal(data.get("collectiveMinQty"));

    // Compra Coletiva ativa sem nenhuma faixa de preço preenchida: o comprador não veria
    // nenhum valor evolutivo. Bloqueia e avisa em vez de publicar silenciosamente sem faixas.
    if (collectiveEnabled && validTiers.length === 0) {
      toast.error("Preencha ao menos uma faixa de preço na Compra Coletiva (% da meta + preço), ou desmarque essa modalidade.");
      return;
    }

    // Proteger publicação com confirmação
    const confirmed = window.confirm(
      `CONFIRMAR PUBLICAÇÃO?\n\n` +
      `Produto: ${String(data.get("product"))}\n` +
      `Categoria: ${category?.name || "Outros"}\n` +
      `Preço Zup: R$ ${parseDecimal(data.get("normalPrice"))}\n` +
      `Meta: ${targetQuantity} unidades\n` +
      `Prazo: ${deadline}\n\n` +
      `Depois de publicar, você não poderá voltar desta página.`
    );

    if (!confirmed) return;

    const normalPriceValue = parseDecimal(data.get("normalPrice"));

    addOffer({
      supplierId: session.id,
      product: String(data.get("product")),
      brand: String(data.get("brand")),
      category: category?.name || "Outros",
      categoryId: category?.id || "outros",
      subcategory: String(data.get("subcategory") || ""),
      description: "",
      unit: String(data.get("unit")),
      normalPrice: normalPriceValue,
      // Preço Zup base: sem input próprio, sempre igual ao preço normal.
      // Faixas progressivas (progressiveTiers) são o único mecanismo de preço evolutivo.
      zuppiPrice: normalPriceValue,
      minGoal: targetQuantity || 0,
      minimumPurchasePerBuyer: collectiveMinQty,
      targetType,
      targetQuantity,
      maxQty: parseDecimal(data.get("maxQty")) || undefined,
      deadline,
      region: city ? `${city.name} — ${city.state}` : "",
      cityId: city?.id,
      paymentTerms: selectedPaymentMethods.join("; "),
      deliveryTime: collectiveEnabled ? String(data.get("deliveryTime") || "") : "",
      notes: String(data.get("notes")),
      imageBase64: productImage || undefined,
      marketSaleEnabled: marketEnabled,
      marketPrice: marketEnabled ? parseDecimal(data.get("marketPrice")) : undefined,
      marketMinimumQuantity: marketEnabled ? parseDecimal(data.get("marketMinQty")) || 1 : undefined,
      marketStock: marketEnabled && data.get("marketStock") ? parseDecimal(data.get("marketStock")) : undefined,
      collectiveSaleEnabled: collectiveEnabled,
      collectiveMinimumQuantity: collectiveEnabled ? collectiveMinQty : undefined,
      progressiveTiers: collectiveEnabled && validTiers.length > 0 ? validTiers : undefined,
    });
    toast.success("Oferta publicada com sucesso!");
    navigate("/fornecedor");
  };

  return (
    <DashboardLayout role="supplier">
      <div className="max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Cadastrar nova oferta</h1>
          <p className="text-sm text-gray-500 mt-1">Preencha os dados da sua oferta para que compradores B2B encontrem você.</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_330px] gap-6 items-start">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <ProductImageUpload value={productImage} onChange={setProductImage} />

            {/* Bloco 1 — Produto */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Produto</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-base">Produto</label>
                  <input required name="product" placeholder="Ex: Farinha de Trigo 25kg" className="input-base w-full" />
                </div>
                <div>
                  <label className="label-base">Marca</label>
                  <input required name="brand" placeholder="Ex: Tradição" className="input-base w-full" />
                </div>
                <div>
                  <label className="label-base">Categoria</label>
                  <select required name="categoryId" className="input-base w-full">
                    {categories.filter(c => c.active).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-base">Unidade de venda</label>
                  <select required name="unit" className="input-base w-full">
                    {["kg", "g", "unidade", "caixa", "pacote", "fardo", "litro", "ml", "metro", "tonelada"].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base">Quantidade por unidade</label>
                  <input name="quantityPerUnit" type="number" inputMode="decimal" placeholder="Ex: 5 (para 5 kg)" className="input-base w-full" defaultValue="1" />
                  <p className="text-xs text-gray-400 mt-1">Especifique a quantidade real (ex: 5 kg, não 1 saco)</p>
                </div>
              </div>
            </div>

            {/* Bloco 2 — Preço base */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Preço de referência</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-base">Preço normal de mercado</label>
                  <input
                    required name="normalPrice" type="text" pattern="[0-9.,]+"
                    placeholder="R$ 0,00" className="input-base w-full"
                    onChange={e => setNormalPrice(parseDecimal(e.target.value))}
                  />
                  <p className="text-xs text-gray-400 mt-1">Aceita: 1000,50 ou 1.000,50</p>
                </div>
              </div>
            </div>

            {/* Bloco 3 — Modalidades */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Modalidades de venda</h2>

              {/* Market */}
              <div className={`rounded-2xl border p-4 space-y-4 transition-colors ${marketEnabled ? "border-orange-200 bg-orange-50/30" : "border-gray-100"}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={marketEnabled} onChange={e => setMarketEnabled(e.target.checked)} className="w-4 h-4 accent-orange-500" />
                  <div>
                    <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5">⚡ Market Zup <span className="text-[10px] font-normal text-orange-600 bg-orange-100 rounded-full px-2 py-0.5">Compra imediata</span></p>
                    <p className="text-xs text-gray-500">Comprador adquire sem depender de meta coletiva.</p>
                  </div>
                </label>
                {marketEnabled && (
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label-base">Preço Market Zup</label>
                      <input name="marketPrice" type="text" pattern="[0-9.,]+" placeholder="R$ 0,00" className="input-base w-full"
                        defaultValue={normalPrice > 0 ? String((normalPrice * 0.97).toFixed(2).replace(".", ",")) : ""} />
                    </div>
                    <div>
                      <label className="label-base">Qtd. mínima</label>
                      <input name="marketMinQty" inputMode="decimal" placeholder="Ex: 2" defaultValue="1" className="input-base w-full" />
                    </div>
                    <div>
                      <label className="label-base">Estoque disponível (opcional)</label>
                      <input name="marketStock" inputMode="decimal" placeholder="Opcional" className="input-base w-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Collective */}
              <div className={`rounded-2xl border p-4 space-y-4 transition-colors ${collectiveEnabled ? "border-blue-200 bg-blue-50/20" : "border-gray-100"}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={collectiveEnabled} onChange={e => setCollectiveEnabled(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                  <div>
                    <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5">👥 Compra Coletiva <span className="text-[10px] font-normal text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">Faixas progressivas</span></p>
                    <p className="text-xs text-gray-500">Preço diminui conforme a meta é atingida em grupo.</p>
                  </div>
                </label>
                {collectiveEnabled && (
                  <div className="space-y-4">
                    <div>
                      <label className="label-base">Compra mínima por comprador (coletiva)</label>
                      <input name="collectiveMinQty" inputMode="decimal" placeholder="Ex: 10" className="input-base w-full sm:max-w-[200px]" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="label-base mb-0">Faixas progressivas de preço</label>
                        <button type="button" onClick={addTier} className="text-xs text-blue-600 font-semibold hover:underline">+ Adicionar faixa</button>
                      </div>
                      <div className="overflow-auto rounded-xl border border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400 w-32">% da meta</th>
                              <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-400">Preço por unidade</th>
                              <th className="w-8" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {tiers.map((tier, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2">
                                  <input
                                    type="number" min="1" max="100" value={tier.percentage || ""}
                                    onChange={e => updateTier(i, "percentage", Number(e.target.value))}
                                    className="input-base w-full text-sm" placeholder="Ex: 25"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text" pattern="[0-9.,]+" value={tier.price || ""}
                                    onChange={e => updateTier(i, "price", parseDecimal(e.target.value))}
                                    className="input-base w-full text-sm" placeholder="R$ 0,00"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  {tiers.length > 1 && (
                                    <button type="button" onClick={() => removeTier(i)} className="text-gray-300 hover:text-red-400">
                                      <X size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Dica: o preço de 100% deve ser o menor de todos. O valor mais baixo das faixas ativas será o preço Zup exibido.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 4 — Meta */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Meta</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-base">Meta (quantidade)</label>
                  <input required name="targetQuantity" inputMode="decimal" placeholder="Ex: 400" className="input-base w-full" />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-base">Quantidade máxima</label>
                  <input name="maxQty" inputMode="decimal" placeholder="Opcional" className="input-base w-full" />
                </div>
              </div>
            </div>

            {/* Bloco 4 — Condições */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Condições</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-base flex items-center gap-1.5"><MapPin size={13} className="text-gray-400" />Cidade atendida</label>
                  <select required name="cityId" className="input-base w-full" defaultValue="">
                    <option value="" disabled>Selecione a cidade</option>
                    {cities.filter(c => c.active).map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {c.state}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label-base flex items-center gap-1.5 mb-3"><CreditCard size={13} className="text-gray-400" />Condições de pagamento (selecione 1 ou mais)</label>
                  <div className="space-y-2">
                    {[
                      "Pix direto com o fornecedor",
                      "Dinheiro na retirada",
                      "Cartão de débito direto com o fornecedor",
                      "Cartão de crédito direto com o fornecedor",
                      "Boleto emitido pelo fornecedor",
                      "Faturado para CNPJ aprovado",
                      "A combinar diretamente com o fornecedor",
                    ].map(p => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={p}
                          name="paymentTerms"
                          checked={selectedPaymentMethods.includes(p)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedPaymentMethods([...selectedPaymentMethods, p]);
                            } else {
                              setSelectedPaymentMethods(selectedPaymentMethods.filter(m => m !== p));
                            }
                          }}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <span className="text-sm text-gray-700">{p}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-2">A Zup atua como plataforma facilitadora. Pagamento e demais condições operacionais são tratados diretamente entre comprador e fornecedor.</p>
                </div>
                {collectiveEnabled && (
                  <div>
                    <label className="label-base flex items-center gap-1.5"><Truck size={13} className="text-gray-400" />Prazo de entrega</label>
                    <select required name="deliveryTime" className="input-base w-full">
                      {["até 2 dias após fechamento", "até 3 dias após fechamento", "até 5 dias após fechamento", "até 7 dias após fechamento", "até 10 dias após fechamento", "até 15 dias após fechamento"].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Aplica-se à compra coletiva. Market Zup não tem prazo de entrega fixo.</p>
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-base flex items-center gap-1.5"><Calendar size={13} className="text-gray-400" />Prazo final da oferta</label>
                  <input required type="date" name="deadline" min={todayInputValue()} max={maxOfferDeadlineInputValue()} className="input-base w-full" />
                  <p className="text-xs text-gray-400 mt-1">Máximo de 3 dias para atingir a meta coletiva.</p>
                </div>
                <div>
                  <label className="label-base flex items-center gap-1.5"><Truck size={13} className="text-gray-400" />Valor do frete (opcional)</label>
                  <input name="shippingCost" inputMode="decimal" placeholder="R$ 0,00" className="input-base w-full" />
                  <p className="text-xs text-gray-400 mt-1">Deixe vazio se frete é por conta do comprador</p>
                </div>
              </div>
            </div>

            {/* Bloco 5 — Observações */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Observações</h2>
              <textarea
                name="notes"
                placeholder="Ex: Oferta exclusiva para compradores B2B"
                maxLength={200}
                rows={3}
                className="input-base w-full resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => navigate("/fornecedor")}>
                Salvar rascunho
              </button>
              <Link to="/fornecedor/simulador" className="btn-secondary flex-1 justify-center text-center">
                Simular antes de publicar
              </Link>
              <button type="submit" className="btn-primary flex-1 justify-center">
                <ExternalLink size={15} /> Publicar oferta
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              🔒 Seus dados estão protegidos com criptografia de ponta a ponta.
            </p>
          </form>

          {/* MarketIntelPanel desativado até oferta ser publicada */}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── OFFER DETAIL ──────────────────────────────────────────────────────────────

function SupplierOfferEditForm({ offer }: { offer: Offer }) {
  const { updateOffer, cities } = useAppState();
  const navigate = useNavigate();
  const [formError, setFormError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const data = new FormData(event.currentTarget);
    const city = cities.find(c => c.id === String(data.get("cityId")));

    const result = updateOffer(offer.id, {
      normalPrice: parseDecimal(data.get("normalPrice")),
      marketPrice: offer.marketSaleEnabled ? parseDecimal(data.get("marketPrice")) : offer.marketPrice,
      deadline: String(data.get("deadline")),
      deliveryTime: offer.collectiveSaleEnabled !== false ? String(data.get("deliveryTime") || "") : offer.deliveryTime,
      region: city ? `${city.name} — ${city.state}` : offer.region,
      cityId: city?.id ?? offer.cityId,
      notes: String(data.get("notes") || ""),
    });

    if (!result.ok) {
      setFormError(result.message || "Não foi possível salvar as alterações.");
      return;
    }
    toast.success("Oferta atualizada com sucesso!");
    navigate(`/fornecedor/ofertas/${offer.id}`);
  };

  const maxDeadline = maxEditDeadlineInputValue(offer.createdAt);

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Editar oferta</h2>
        <Link to={`/fornecedor/ofertas/${offer.id}`} className="text-sm text-gray-500 hover:underline">Cancelar</Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label-base">Preço normal (R$)</label>
          <input required name="normalPrice" type="text" pattern="[0-9.,]+" defaultValue={String(offer.normalPrice).replace(".", ",")} className="input-base w-full" />
        </div>
        {offer.marketSaleEnabled && (
          <div>
            <label className="label-base">Preço Market Zup (R$)</label>
            <input required name="marketPrice" type="text" pattern="[0-9.,]+" defaultValue={String(offer.marketPrice ?? offer.normalPrice).replace(".", ",")} className="input-base w-full" />
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label-base flex items-center gap-1.5"><Calendar size={13} className="text-gray-400" />Prazo final da oferta</label>
          <input required type="date" name="deadline" min={todayInputValue()} max={maxDeadline} defaultValue={offer.deadline} className="input-base w-full" />
          <p className="text-xs text-gray-400 mt-1">Máximo até {maxDeadline} (lançamento + 3 dias).</p>
        </div>
        <div>
          <label className="label-base flex items-center gap-1.5"><MapPin size={13} className="text-gray-400" />Cidade atendida</label>
          <select name="cityId" defaultValue={offer.cityId || ""} className="input-base w-full">
            <option value="">Manter: {offer.region || "não definida"}</option>
            {cities.filter(c => c.active).map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.state}</option>
            ))}
          </select>
        </div>
      </div>

      {offer.collectiveSaleEnabled !== false && (
        <div>
          <label className="label-base flex items-center gap-1.5"><Truck size={13} className="text-gray-400" />Prazo de entrega</label>
          <select required name="deliveryTime" defaultValue={offer.deliveryTime} className="input-base w-full">
            {["até 2 dias após fechamento", "até 3 dias após fechamento", "até 5 dias após fechamento", "até 7 dias após fechamento", "até 10 dias após fechamento", "até 15 dias após fechamento"].map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label-base">Observações</label>
        <textarea name="notes" defaultValue={offer.notes} maxLength={200} className="input-base w-full" rows={3} />
      </div>

      {formError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}

      <button className="btn-primary">Salvar alterações</button>
    </form>
  );
}

export function SupplierOfferDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { session, suppliers, offers, reservations, updateOfferImage } = useAppState();
  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const supplier = suppliers.find(s => s.id === session.id);
  const offer = offers.find(o => o.id === id && o.supplierId === session.id);

  if (!offer) return (
    <DashboardLayout role="supplier">
      <div className="card p-8 text-center">
        <AlertCircle size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500">Oferta não encontrada.</p>
        <Link to="/fornecedor" className="btn-primary mt-4 mx-auto">Voltar ao painel</Link>
      </div>
    </DashboardLayout>
  );

  const offerRes = reservations.filter(r => r.offerId === offer.id);
  const progress = offerProgress(offer);
  const availability = offerAvailability(offer);
  const canSeeDetails = supplier?.planoFornecedor === "assinante";
  const totalAmount = offerRes.reduce((a, r) => a + r.totalAmount, 0);
  const isEditMode = searchParams.get("edit") === "1";

  if (isEditMode) {
    if (offer.editStatus === "edicao_bloqueada" || offerRes.length > 0) {
      return (
        <DashboardLayout role="supplier">
          <div className="max-w-5xl space-y-4">
            <div className="card p-8 text-center border-dashed border-2 border-orange-200 bg-orange-50/50">
              <Lock size={28} className="mx-auto text-orange-400 mb-2" />
              <p className="font-bold text-gray-700">Esta oferta já tem compradores interessados</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">Para alterar, envie uma solicitação de edição para aprovação em vez de editar direto.</p>
              <Link to={`/fornecedor/ofertas/${offer.id}`} className="btn-secondary mx-auto">Voltar aos detalhes</Link>
            </div>
          </div>
        </DashboardLayout>
      );
    }
    return (
      <DashboardLayout role="supplier">
        <div className="max-w-5xl">
          <SupplierOfferEditForm offer={offer} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="supplier">
      <div className="max-w-5xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">{offer.product}</h1>
              <span className={statusColors[offer.status] || "badge-rascunho"}>{offer.status.replace(/_/g, " ")}</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{offer.brand} · {offer.category}</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/fornecedor/ofertas/${offer.id}?edit=1`} className="btn-secondary">Editar oferta</Link>
            <button className="btn-secondary" onClick={() => window.print()}>
              <FileText size={14} /> Imprimir / PDF
            </button>
          </div>
        </div>

        <ProductImageUpload
          value={offer.imageBase64 || null}
          onChange={(base64) => updateOfferImage(offer.id, base64 || undefined)}
        />

        <div className="grid sm:grid-cols-4 gap-4">
          <MetricCard title="Meta" value={formatGoal(offer, progress.target)} icon={TrendingUp} />
          <MetricCard title="Reservado" value={formatGoal(offer, progress.current)} icon={Package} />
          <MetricCard title="Valor reservado" value={currency(totalAmount)} icon={DollarSign} />
          <MetricCard title="Disponível" value={`${availability.availablePercent}%`} sub={`${availability.available} ${offer.unit}`} icon={Users} />
        </div>

        <div className="card p-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Progresso da meta</span>
            <span className={`font-bold ${progress.percent >= 100 ? "text-green-600" : "text-orange-600"}`}>{progress.percent}%</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progress.percent >= 100 ? "bg-green-500" : "bg-orange-500"}`}
              style={{ width: `${Math.min(progress.percent, 100)}%` }}
            />
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">Pedidos da oferta</h2>
            <span className="text-sm text-gray-500">{offerRes.length} reserva(s)</span>
          </div>

          {!canSeeDetails ? (
            <div className="card p-6 text-center border-dashed border-2 border-orange-200 bg-orange-50/50">
              <Lock size={28} className="mx-auto text-orange-400 mb-2" />
              <p className="font-bold text-gray-700">Dados dos compradores protegidos</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Você pode ver o total de reservas. Para dados completos, ative o Plano Pro.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Compradores", value: String(offerRes.length) },
                  { label: "Da meta", value: `${progress.percent}%` },
                  { label: "Reservado", value: currency(totalAmount) },
                ].map(m => (
                  <div key={m.label} className="bg-white rounded-xl p-3 border border-orange-100 text-center">
                    <p className="text-2xl font-bold text-orange-600">{m.value}</p>
                    <p className="text-xs text-gray-500">{m.label}</p>
                  </div>
                ))}
              </div>
              <button className="btn-primary mx-auto">
                <Crown size={15} /> Ativar Plano Pro
              </button>
            </div>
          ) : (
            <div className="card overflow-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Empresa", "CNPJ", "Responsável", "WhatsApp", "Cidade", "Segmento", "Qtd", "Unitário", "Total", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {offerRes.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium">{r.buyerSnapshot.companyName}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{r.buyerSnapshot.cnpj}</td>
                      <td className="px-4 py-3">{r.buyerSnapshot.contactName}</td>
                      <td className="px-4 py-3">{r.buyerSnapshot.whatsapp}</td>
                      <td className="px-4 py-3">{r.buyerSnapshot.city}</td>
                      <td className="px-4 py-3">{r.buyerSnapshot.segment}</td>
                      <td className="px-4 py-3 font-medium">{r.quantity} {r.unit}</td>
                      <td className="px-4 py-3">{currency(r.unitPrice)}</td>
                      <td className="px-4 py-3 font-semibold text-orange-600">{currency(r.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className="badge-ativa text-xs">{reservationLabel[r.status] || r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

// ─── PEDIDOS (ex-Pré-pedidos) ─────────────────────────────────────────────────

type PreOrderTab = "todas" | "market" | "coletivas" | "em_negociacao" | "concluidos" | "nao_cumpriu" | "cancelados";

const ALL_STATUS_LABELS: Record<string, string> = {
  ordem_gerada: "Ordem gerada",
  fornecedor_notificado: "Fornecedor notificado",
  em_tratativa_com_fornecedor: "Em negociação",
  venda_concluida: "Venda concluída",
  cliente_nao_cumpriu: "Cliente não cumpriu",
  cancelada: "Cancelada",
  cancelado: "Cancelada",
  aguardando_meta: "Aguardando meta",
  intencao_registrada: "Intenção registrada",
  faixa_atingida: "Faixa atingida",
  meta_atingida: "Meta atingida",
  prazo_finalizado: "Prazo finalizado",
  confirmado: "Confirmado",
  entregue: "Concluído",
};

const STATUS_BADGE: Record<string, string> = {
  ordem_gerada: "badge-ativa",
  em_tratativa_com_fornecedor: "badge-ativa",
  venda_concluida: "badge-meta_atingida",
  cliente_nao_cumpriu: "badge-cancelada",
  cancelada: "badge-cancelada",
  cancelado: "badge-cancelada",
  aguardando_meta: "badge-aguardando_aprovacao",
  intencao_registrada: "badge-aguardando_aprovacao",
  faixa_atingida: "badge-ativa",
  meta_atingida: "badge-meta_atingida",
};

function whatsappLink(phone: string, supplierName: string, product: string, qty: number, unit: string) {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  const msg = encodeURIComponent(`Olá, aqui é da ${supplierName}. Recebemos sua ordem pela Zup referente ao produto ${product}, quantidade ${qty} ${unit}. Vamos seguir com a finalização da compra?`);
  return `https://wa.me/${number}?text=${msg}`;
}

// ─── CLIENT MODAL ───────────────────────────────────────────────────────────

interface ClientModalProps {
  buyer: { companyName: string; cnpj?: string; contactName: string; whatsapp: string; email: string; city: string; segment?: string; neighborhood?: string; cpf?: string; rating?: number; fulfilledPurchases?: number; brokenIntentions?: number; buyerType?: string };
  order: { product: string; purchaseMode?: string; quantity: number; unit: string; unitPrice: number; totalAmount: number; status: string; createdAt: string };
  supplierName: string;
  onClose: () => void;
}

function ClientModal({ buyer, order, supplierName, onClose }: ClientModalProps) {
  const isB2C = buyer.buyerType === "b2c";
  const hasWhatsApp = !!buyer.whatsapp?.trim();
  const link = hasWhatsApp ? whatsappLink(buyer.whatsapp, supplierName, order.product, order.quantity, order.unit) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Dados do cliente</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Buyer data */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isB2C ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                {isB2C ? "B2C — Pessoa Física" : "B2B — Pessoa Jurídica"}
              </span>
              {buyer.rating !== undefined && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${buyer.rating >= 80 ? "bg-green-100 text-green-700" : buyer.rating >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                  Pontuação: {buyer.rating}/100
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Nome/Razão Social</p><p className="font-semibold text-gray-800">{buyer.companyName}</p></div>
              {!isB2C && buyer.cnpj && <div><p className="text-xs text-gray-400">CNPJ</p><p className="font-medium text-gray-700">{buyer.cnpj}</p></div>}
              {isB2C && buyer.cpf && <div><p className="text-xs text-gray-400">CPF</p><p className="font-medium text-gray-700">{buyer.cpf}</p></div>}
              <div><p className="text-xs text-gray-400">Responsável</p><p className="font-medium text-gray-700">{buyer.contactName}</p></div>
              <div><p className="text-xs text-gray-400">E-mail</p><p className="font-medium text-gray-700 truncate">{buyer.email}</p></div>
              <div><p className="text-xs text-gray-400">Cidade</p><p className="font-medium text-gray-700">{buyer.city}{buyer.neighborhood ? ` · ${buyer.neighborhood}` : ""}</p></div>
              {!isB2C && buyer.segment && <div><p className="text-xs text-gray-400">Segmento</p><p className="font-medium text-gray-700 capitalize">{buyer.segment}</p></div>}
              {buyer.fulfilledPurchases !== undefined && (
                <div><p className="text-xs text-gray-400">Compras cumpridas</p><p className="font-medium text-green-600">{buyer.fulfilledPurchases}</p></div>
              )}
              {buyer.brokenIntentions !== undefined && buyer.brokenIntentions > 0 && (
                <div><p className="text-xs text-gray-400">Não cumpriu</p><p className="font-medium text-red-500">{buyer.brokenIntentions}x</p></div>
              )}
            </div>
          </div>

          {/* WhatsApp */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-400 mb-2">WhatsApp</p>
            {hasWhatsApp ? (
              <div className="flex items-center gap-3">
                <p className="font-semibold text-gray-700">{buyer.whatsapp}</p>
                <a href={link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                  <ExternalLink size={14} /> Chamar no WhatsApp
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Cliente sem WhatsApp cadastrado.</p>
            )}
          </div>

          {/* Order summary */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Resumo do pedido</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Produto</p><p className="font-semibold text-gray-800">{order.product}</p></div>
              <div><p className="text-xs text-gray-400">Tipo</p><p className="font-medium text-gray-700">{order.purchaseMode === "market" ? "⚡ Market Zup" : "👥 Compra coletiva"}</p></div>
              <div><p className="text-xs text-gray-400">Quantidade</p><p className="font-medium text-gray-700">{order.quantity.toLocaleString("pt-BR")} {order.unit}</p></div>
              <div><p className="text-xs text-gray-400">Preço unit.</p><p className="font-medium text-gray-700">{currency(order.unitPrice)}</p></div>
              <div><p className="text-xs text-gray-400">Valor total</p><p className="font-bold text-orange-600">{currency(order.totalAmount)}</p></div>
              <div><p className="text-xs text-gray-400">Status</p><span className={`${STATUS_BADGE[order.status] || "badge-aguardando_aprovacao"} text-xs`}>{ALL_STATUS_LABELS[order.status] || order.status}</span></div>
              <div><p className="text-xs text-gray-400">Data</p><p className="font-medium text-gray-700">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT STATUS MODAL ──────────────────────────────────────────────────────

const EDITABLE_MARKET_STATUSES: { value: string; label: string }[] = [
  { value: "em_tratativa_com_fornecedor", label: "Em negociação" },
  { value: "venda_concluida", label: "Venda concluída" },
  { value: "cliente_nao_cumpriu", label: "Cliente não cumpriu" },
  { value: "cancelada", label: "Cancelada" },
];

const EDITABLE_COLLECTIVE_STATUSES: { value: string; label: string }[] = [
  { value: "em_tratativa_com_fornecedor", label: "Em negociação" },
  { value: "venda_concluida", label: "Venda concluída" },
  { value: "cliente_nao_cumpriu", label: "Cliente não cumpriu" },
  { value: "cancelado", label: "Cancelada" },
];

interface EditStatusModalProps {
  currentStatus: string;
  isMarket: boolean;
  onSave: (status: string, note: string) => void;
  onClose: () => void;
}

function EditStatusModal({ currentStatus, isMarket, onSave, onClose }: EditStatusModalProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const options = isMarket ? EDITABLE_MARKET_STATUSES : EDITABLE_COLLECTIVE_STATUSES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Editar status</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Status atual</p>
            <span className={`${STATUS_BADGE[currentStatus] || "badge-aguardando_aprovacao"} text-xs`}>{ALL_STATUS_LABELS[currentStatus] || currentStatus}</span>
          </div>
          <div>
            <label className="label-base">Novo status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-base w-full">
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Observação (opcional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="input-base w-full resize-none" placeholder="Ex: Entrei em contato pelo WhatsApp..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancelar</button>
            <button onClick={() => onSave(newStatus, note)} className="btn-primary flex-1 justify-center">Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Unified row type for the orders table
type OrderRow =
  | { kind: "market"; id: string; buyerId: string; buyerType?: string; buyerSnapshot: { companyName: string; cnpj?: string; contactName: string; whatsapp: string; email: string; city: string; segment?: string }; product: string; quantity: number; unit: string; unitPrice: number; totalAmount: number; status: string; createdAt: string }
  | { kind: "collective"; id: string; buyerId: string; buyerType?: string; buyerSnapshot: { companyName: string; cnpj?: string; contactName: string; whatsapp: string; email: string; city: string; segment?: string }; product: string; quantity: number; unit: string; unitPrice: number; totalAmount: number; status: string; createdAt: string };

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getMonthOptions() {
  const now = new Date();
  const opts: { value: string; label: string }[] = [{ value: "all", label: "Todos os meses" }];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    opts.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
  }
  return opts;
}

function matchesMonth(dateStr: string, monthFilter: string) {
  if (monthFilter === "all") return true;
  return dateStr.startsWith(monthFilter);
}

export function SupplierPreOrdersPage() {
  const { session, offers, reservations, marketOrders, updateMarketOrderStatus, updateReservationStatus, updateBuyerScore, buyers } = useAppState();
  const [tab, setTab] = useState<PreOrderTab>("todas");
  const [monthFilter, setMonthFilter] = useState("all");
  const [clientModal, setClientModal] = useState<OrderRow | null>(null);
  const [editStatusRow, setEditStatusRow] = useState<OrderRow | null>(null);

  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const supplierProfile = session as { companyName?: string };
  const supplierName = supplierProfile.companyName || "Fornecedor";

  const myOfferIds = new Set(offers.filter(o => o.supplierId === session.id).map(o => o.id));
  const myReservations = reservations.filter(r => myOfferIds.has(r.offerId) && r.purchaseMode !== "market");
  const myMarketOrders = marketOrders.filter(o => myOfferIds.has(o.offerId));

  // Build unified rows for display
  const allRows: OrderRow[] = [
    ...myMarketOrders.map(o => ({
      kind: "market" as const, id: o.id, buyerId: o.buyerId, buyerType: o.buyerType,
      buyerSnapshot: o.buyerSnapshot as OrderRow["buyerSnapshot"],
      product: o.product, quantity: o.quantity, unit: o.unit, unitPrice: o.unitPrice, totalAmount: o.totalAmount,
      status: o.status, createdAt: o.createdAt,
    })),
    ...myReservations.map(r => ({
      kind: "collective" as const, id: r.id, buyerId: r.buyerId, buyerType: r.buyerType,
      buyerSnapshot: r.buyerSnapshot as OrderRow["buyerSnapshot"],
      product: r.product, quantity: r.quantity, unit: r.unit,
      unitPrice: r.finalPrice ?? (r.quantity > 0 ? r.totalAmount / r.quantity : 0),
      totalAmount: r.totalAmount, status: r.status, createdAt: r.createdAt,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const monthOptions = getMonthOptions();
  const filteredByMonth = allRows.filter(r => matchesMonth(r.createdAt, monthFilter));

  function applyTabFilter(rows: typeof allRows): typeof allRows {
    switch (tab) {
      case "market": return rows.filter(r => r.kind === "market");
      case "coletivas": return rows.filter(r => r.kind === "collective");
      case "em_negociacao": return rows.filter(r => r.status === "em_tratativa_com_fornecedor");
      case "concluidos": return rows.filter(r => ["venda_concluida", "confirmado", "entregue"].includes(r.status));
      case "nao_cumpriu": return rows.filter(r => r.status === "cliente_nao_cumpriu");
      case "cancelados": return rows.filter(r => ["cancelada", "cancelado"].includes(r.status));
      default: return rows;
    }
  }

  const visibleRows = applyTabFilter(filteredByMonth);

  // KPIs for month
  const monthRows = filteredByMonth;
  const concludedRows = monthRows.filter(r => ["venda_concluida", "confirmado", "entregue"].includes(r.status));
  const notFulfilledRows = monthRows.filter(r => r.status === "cliente_nao_cumpriu");
  const potentialValue = monthRows.reduce((a, r) => a + r.totalAmount, 0);
  const concludedValue = concludedRows.reduce((a, r) => a + r.totalAmount, 0);

  const handleSaveStatus = (row: OrderRow, newStatus: string) => {
    if (row.kind === "market") {
      updateMarketOrderStatus(row.id, newStatus as Parameters<typeof updateMarketOrderStatus>[1]);
      if (newStatus === "venda_concluida") updateBuyerScore(row.buyerId, true);
      else if (newStatus === "cliente_nao_cumpriu") updateBuyerScore(row.buyerId, false);
    } else {
      updateReservationStatus(row.id, newStatus as Parameters<typeof updateReservationStatus>[1]);
      if (newStatus === "venda_concluida") updateBuyerScore(row.buyerId, true);
      else if (newStatus === "cliente_nao_cumpriu") updateBuyerScore(row.buyerId, false);
    }
    setEditStatusRow(null);
  };

  function getBuyerForModal(row: OrderRow) {
    const buyerProfile = buyers?.find((b) => b.id === row.buyerId);
    return {
      companyName: row.buyerSnapshot.companyName,
      cnpj: row.buyerSnapshot.cnpj,
      contactName: row.buyerSnapshot.contactName,
      whatsapp: row.buyerSnapshot.whatsapp,
      email: row.buyerSnapshot.email,
      city: row.buyerSnapshot.city,
      segment: row.buyerSnapshot.segment,
      neighborhood: buyerProfile?.neighborhood,
      cpf: buyerProfile?.cpf,
      rating: buyerProfile?.rating,
      fulfilledPurchases: buyerProfile?.fulfilledPurchases,
      brokenIntentions: buyerProfile?.brokenIntentions,
      buyerType: row.buyerType,
    };
  }

  const TABS: { value: PreOrderTab; label: string }[] = [
    { value: "todas", label: "Todas" },
    { value: "market", label: "⚡ Market" },
    { value: "coletivas", label: "👥 Coletivas" },
    { value: "em_negociacao", label: "Em negociação" },
    { value: "concluidos", label: "Concluídas" },
    { value: "nao_cumpriu", label: "Não cumpriu" },
    { value: "cancelados", label: "Canceladas" },
  ];

  return (
    <DashboardLayout role="supplier">
      <div className="space-y-5 max-w-6xl pb-24 md:pb-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Pedidos</h1>
            <p className="text-sm text-gray-400 mt-0.5">Ordens Market Zup e intenções coletivas.</p>
          </div>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="input-base w-44 text-sm">
            {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* KPI cards */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Pedidos no mês" value={String(monthRows.length)} sub={`${monthRows.filter(r => r.kind === "market").length} Market · ${monthRows.filter(r => r.kind === "collective").length} Coletivas`} icon={Package} />
          <MetricCard title="Valor potencial" value={currency(potentialValue)} sub="todas as ordens do mês" icon={TrendingUp} />
          <MetricCard title="Vendas concluídas" value={String(concludedRows.length)} sub={currency(concludedValue)} icon={CheckCircle} />
          <MetricCard title="Clientes não cumpriram" value={String(notFulfilledRows.length)} sub={notFulfilledRows.length > 0 ? "Atenção ao perfil dos clientes" : "Sem ocorrências"} icon={AlertCircle} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${tab === t.value ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders table */}
        {visibleRows.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  {["Tipo", "Comprador", "Produto", "Qtd.", "Valor", "Status", "Data", "Ações"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibleRows.map(row => (
                  <tr key={`${row.kind}-${row.id}`} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${row.kind === "market" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-600"}`}>
                          {row.kind === "market" ? "⚡ Market" : "👥 Coletiva"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${row.buyerType === "b2c" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                          {row.buyerType === "b2c" ? "B2C" : "B2B"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setClientModal(row)} className="font-medium text-gray-800 hover:text-orange-600 text-left transition-colors">
                        {row.buyerSnapshot.companyName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.product}</td>
                    <td className="px-4 py-3 text-gray-700">{row.quantity.toLocaleString("pt-BR")} {row.unit}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{currency(row.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`${STATUS_BADGE[row.status] || "badge-aguardando_aprovacao"} text-xs`}>
                        {ALL_STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(row.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => setClientModal(row)} className="text-[10px] border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50 text-gray-600">Ver cliente</button>
                        <button onClick={() => setEditStatusRow(row)} className="text-[10px] border border-orange-200 text-orange-600 rounded-lg px-2 py-1 hover:bg-orange-50">Editar status</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            {allRows.length === 0
              ? <><span>Nenhuma ordem ou intenção encontrada.</span> <Link to="/fornecedor/criar-oferta" className="text-orange-600 font-semibold hover:underline ml-1">Criar oferta</Link></>
              : "Nenhum pedido para o filtro selecionado."}
          </div>
        )}
      </div>

      {/* Modals */}
      {clientModal && (
        <ClientModal
          buyer={getBuyerForModal(clientModal)}
          order={{ product: clientModal.product, purchaseMode: clientModal.kind === "market" ? "market" : "collective", quantity: clientModal.quantity, unit: clientModal.unit, unitPrice: clientModal.unitPrice, totalAmount: clientModal.totalAmount, status: clientModal.status, createdAt: clientModal.createdAt }}
          supplierName={supplierName}
          onClose={() => setClientModal(null)}
        />
      )}
      {editStatusRow && (
        <EditStatusModal
          currentStatus={editStatusRow.status}
          isMarket={editStatusRow.kind === "market"}
          onSave={(newStatus) => handleSaveStatus(editStatusRow, newStatus)}
          onClose={() => setEditStatusRow(null)}
        />
      )}
    </DashboardLayout>
  );
}
