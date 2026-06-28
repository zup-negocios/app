import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Package, ArrowLeft, FileDown, Headphones, ExternalLink, Zap, Users, Info } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency, dateLabel, getCurrentCollectivePrice, getBestCollectivePrice, getNextTier, offerProgress } from "../utils/business";
import { ProgressBarMeta } from "../components/ProgressBarMeta";
import type { MarketOrderStatus, ReservationStatus } from "../types";

const FACILITADORA_NOTICE = "A Zup atua como plataforma facilitadora de conexão comercial. Pagamento, emissão fiscal, retirada, entrega e demais condições operacionais devem ser tratados diretamente entre comprador e fornecedor.";

// ─── Status maps ─────────────────────────────────────────────────────────────

const collectiveStatusLabel: Record<string, string> = {
  intencao_registrada: "Intenção registrada",
  aguardando_meta: "Aguardando meta",
  faixa_atingida: "Faixa atingida",
  meta_atingida: "Meta atingida",
  prazo_finalizado: "Prazo finalizado",
  ordem_gerada: "Ordem gerada",
  em_tratativa_com_fornecedor: "Em negociação",
  venda_concluida: "Concluída",
  cliente_nao_cumpriu: "Não cumprida",
  cancelado: "Cancelada",
  reservado: "Aguardando meta",
  em_andamento: "Aguardando meta",
  meta_batida: "Meta atingida",
  confirmado: "Pedido confirmado",
  entregue: "Concluída",
};

const marketStatusLabel: Record<string, string> = {
  ordem_gerada: "Ordem gerada",
  fornecedor_notificado: "Fornecedor notificado",
  em_tratativa_com_fornecedor: "Em negociação",
  venda_concluida: "Concluída",
  cliente_nao_cumpriu: "Não cumprida",
  cancelada: "Cancelada",
};

const badgeClass: Record<string, string> = {
  aguardando_meta: "badge-aguardando_aprovacao",
  intencao_registrada: "badge-aguardando_aprovacao",
  reservado: "badge-aguardando_aprovacao",
  em_andamento: "badge-aguardando_aprovacao",
  faixa_atingida: "badge-ativa",
  meta_atingida: "badge-meta_atingida",
  meta_batida: "badge-meta_atingida",
  prazo_finalizado: "badge-meta_atingida",
  ordem_gerada: "badge-ativa",
  fornecedor_notificado: "badge-ativa",
  em_tratativa_com_fornecedor: "badge-ativa",
  venda_concluida: "badge-ativa",
  confirmado: "badge-ativa",
  entregue: "badge-ativa",
  cliente_nao_cumpriu: "badge-cancelada",
  cancelado: "badge-cancelada",
  cancelada: "badge-cancelada",
};

function daysLeft(deadline: string) {
  const diff = new Date(`${deadline}T23:59:59`).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

// ─── PURCHASES PAGE ──────────────────────────────────────────────────────────

type TabId = "todas" | "market" | "coletivas" | "andamento" | "ordens" | "concluidas" | "canceladas";

const tabs: { id: TabId; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "market", label: "Market" },
  { id: "coletivas", label: "Coletivas" },
  { id: "andamento", label: "Em andamento" },
  { id: "ordens", label: "Ordens geradas" },
  { id: "concluidas", label: "Concluídas" },
  { id: "canceladas", label: "Canceladas" },
];

export function BuyerPurchasesPage() {
  const { session, reservations, marketOrders, offers } = useAppState();
  const [activeTab, setActiveTab] = useState<TabId>("todas");

  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const myCollective = reservations.filter(r => r.buyerId === session.id && r.purchaseMode !== "market");
  const myMarket = marketOrders.filter(o => o.buyerId === session.id);

  const filteredCollective = useMemo(() => {
    if (activeTab === "market") return [];
    if (activeTab === "coletivas" || activeTab === "todas") return myCollective;
    if (activeTab === "andamento") return myCollective.filter(r => ["aguardando_meta", "intencao_registrada", "reservado", "em_andamento", "faixa_atingida"].includes(r.status));
    if (activeTab === "ordens") return myCollective.filter(r => ["meta_atingida", "prazo_finalizado", "ordem_gerada", "meta_batida"].includes(r.status));
    if (activeTab === "concluidas") return myCollective.filter(r => ["venda_concluida", "entregue", "confirmado", "em_tratativa_com_fornecedor"].includes(r.status));
    if (activeTab === "canceladas") return myCollective.filter(r => ["cliente_nao_cumpriu", "cancelado"].includes(r.status));
    return [];
  }, [myCollective, activeTab]);

  const filteredMarket = useMemo(() => {
    if (activeTab === "coletivas") return [];
    if (activeTab === "market" || activeTab === "todas") return myMarket;
    if (activeTab === "andamento") return myMarket.filter(o => ["ordem_gerada", "fornecedor_notificado"].includes(o.status));
    if (activeTab === "ordens") return myMarket.filter(o => o.status === "em_tratativa_com_fornecedor");
    if (activeTab === "concluidas") return myMarket.filter(o => o.status === "venda_concluida");
    if (activeTab === "canceladas") return myMarket.filter(o => ["cliente_nao_cumpriu", "cancelada"].includes(o.status));
    return [];
  }, [myMarket, activeTab]);

  const totalItems = filteredCollective.length + filteredMarket.length;

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-4 max-w-5xl pb-24 md:pb-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Minhas compras</h1>
          <p className="text-sm text-gray-500 mt-0.5">Acompanhe compras Market e participações em coletivas.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-orange-500 text-white" : "bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {totalItems === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400 text-sm">Nenhuma compra encontrada nesta categoria.</p>
            <Link to="/ofertas" className="btn-primary mt-4 mx-auto text-sm">Ver ofertas disponíveis</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Market orders */}
            {filteredMarket.map(order => {
              const offer = offers.find(o => o.id === order.offerId);
              return (
                <article key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {offer?.imageBase64
                      ? <img src={offer.imageBase64} alt={order.product} className="w-full h-full object-cover" />
                      : <Package size={24} className="text-orange-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-orange-500" />
                      <h3 className="font-bold text-gray-800">{order.product}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{order.supplierSnapshot.companyName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.quantity.toLocaleString("pt-BR")} {order.unit} · {currency(order.unitPrice)}/{order.unit} · <b className="text-orange-600">{currency(order.totalAmount)}</b>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Market · {dateLabel(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                    <span className={`${badgeClass[order.status] || "badge-ativa"} text-xs`}>{marketStatusLabel[order.status] || order.status}</span>
                    <Link to={`/comprador/minhas-compras/market-${order.id}`} className="text-sm text-orange-600 font-semibold hover:underline">
                      Ver detalhes
                    </Link>
                  </div>
                </article>
              );
            })}

            {/* Collective intents */}
            {filteredCollective.map(reservation => {
              const offer = offers.find(o => o.id === reservation.offerId);
              const progress = offer ? offerProgress(offer) : null;
              return (
                <article key={reservation.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {offer?.imageBase64
                      ? <img src={offer.imageBase64} alt={reservation.product} className="w-full h-full object-cover" />
                      : <Package size={24} className="text-blue-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-blue-500" />
                      <h3 className="font-bold text-gray-800">{reservation.product}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{reservation.supplierSnapshot.companyName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {reservation.quantity.toLocaleString("pt-BR")} {reservation.unit} · <b className="text-blue-600">{currency(reservation.totalAmount)}</b>
                    </p>
                    {offer && progress && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Preço atual: <b className="text-blue-600">{currency(getCurrentCollectivePrice(offer))}/{offer.unit}</b></span>
                          <span>Meta: {progress.percent}%</span>
                        </div>
                        <ProgressBarMeta current={progress.current} total={progress.target} />
                        {(() => { const nextTier = getNextTier(offer); return nextTier ? <p className="text-xs text-blue-500">📈 Próxima faixa em {nextTier.percentage}%: {currency(nextTier.price)}/{offer.unit} · Melhor: {currency(getBestCollectivePrice(offer))}</p> : null; })()}
                        <p className="text-xs text-gray-400">Coletiva · {dateLabel(reservation.createdAt)}{offer.deadline ? ` · ${daysLeft(offer.deadline)}d restantes` : ""}</p>
                      </div>
                    )}
                    {!offer && <p className="text-xs text-gray-400 mt-0.5">Coletiva · {dateLabel(reservation.createdAt)}</p>}
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                    <span className={`${badgeClass[reservation.status] || "badge-aguardando_aprovacao"} text-xs`}>
                      {collectiveStatusLabel[reservation.status] || reservation.status}
                    </span>
                    <Link to={`/comprador/minhas-compras/${reservation.id}`} className="text-sm text-orange-600 font-semibold hover:underline">
                      Ver detalhes
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── PURCHASE DETAIL ─────────────────────────────────────────────────────────

function timelineIndex(status: ReservationStatus) {
  if (["reservado", "aguardando_meta", "intencao_registrada", "em_andamento"].includes(status)) return 1;
  if (["faixa_atingida"].includes(status)) return 2;
  if (["meta_atingida", "meta_batida", "prazo_finalizado"].includes(status)) return 3;
  if (["ordem_gerada", "em_tratativa_com_fornecedor"].includes(status)) return 4;
  if (["venda_concluida", "confirmado", "entregue"].includes(status)) return 5;
  return 0;
}

function marketTimelineIndex(status: MarketOrderStatus) {
  if (status === "ordem_gerada") return 0;
  if (status === "fornecedor_notificado") return 1;
  if (status === "em_tratativa_com_fornecedor") return 2;
  if (status === "venda_concluida") return 3;
  return -1;
}

export function BuyerPurchaseDetailPage() {
  const { id } = useParams();
  const { session, reservations, marketOrders, offers } = useAppState();
  const navigate = useNavigate();

  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const isMarket = id?.startsWith("market-");
  const realId = isMarket ? id!.replace("market-", "") : id!;

  const reservation = useMemo(() => !isMarket ? reservations.find(r => r.id === realId && r.buyerId === session.id) : undefined, [reservations, realId, session.id, isMarket]);
  const marketOrder = useMemo(() => isMarket ? marketOrders.find(o => o.id === realId && o.buyerId === session.id) : undefined, [marketOrders, realId, session.id, isMarket]);

  if (!reservation && !marketOrder) {
    return (
      <DashboardLayout role="buyer">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-500">Compra não encontrada.</p>
          <Link to="/comprador/minhas-compras" className="btn-primary mt-4 inline-block">Voltar</Link>
        </div>
      </DashboardLayout>
    );
  }

  if (marketOrder) {
    const offer = offers.find(o => o.id === marketOrder.offerId);
    const step = marketTimelineIndex(marketOrder.status);
    const marketSteps = ["Ordem gerada", "Fornecedor notificado", "Em negociação com fornecedor", "Venda concluída"];

    return (
      <DashboardLayout role="buyer">
        <div className="max-w-3xl space-y-5 pb-24 md:pb-0">
          <button onClick={() => navigate("/comprador/minhas-compras")} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600">
            <ArrowLeft size={15} /> Voltar
          </button>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
            <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {offer?.imageBase64 ? <img src={offer.imageBase64} alt={marketOrder.product} className="w-full h-full object-cover" /> : <Package size={28} className="text-orange-300" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-orange-500" />
                <h1 className="text-lg font-bold text-gray-800">{marketOrder.product}</h1>
              </div>
              <p className="text-sm text-gray-500">{marketOrder.supplierSnapshot.companyName}</p>
              <div className="grid sm:grid-cols-2 gap-1 mt-2 text-sm">
                <p>Quantidade: <b>{marketOrder.quantity.toLocaleString("pt-BR")} {marketOrder.unit}</b></p>
                <p>Preço: <b>{currency(marketOrder.unitPrice)}/{marketOrder.unit}</b></p>
                <p>Total: <b className="text-orange-600">{currency(marketOrder.totalAmount)}</b></p>
                <p>Data: <b>{dateLabel(marketOrder.createdAt)}</b></p>
              </div>
              <span className={`${badgeClass[marketOrder.status] || "badge-ativa"} mt-2 inline-block text-xs`}>{marketStatusLabel[marketOrder.status]}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-4">Status da ordem</h2>
            <div className="flex flex-col gap-3">
              {marketSteps.map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i <= step ? "bg-orange-500" : "bg-gray-200"}`} />
                  <span className={`text-sm ${i <= step ? "text-gray-800 font-medium" : "text-gray-400"}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <Info size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">{FACILITADORA_NOTICE}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="btn-secondary flex items-center gap-1.5 text-sm" onClick={() => window.print()}>
              <FileDown size={15} /> Baixar resumo
            </button>
            <button className="btn-secondary flex items-center gap-1.5 text-sm">
              <Headphones size={15} /> Suporte
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Collective detail
  const offer = offers.find(o => o.id === reservation!.offerId);
  const economy = offer ? reservation!.quantity * (offer.normalPrice - reservation!.unitPrice) : 0;
  const currentStep = timelineIndex(reservation!.status);

  const collectiveSteps = [
    "Intenção registrada",
    "Aguardando meta / em andamento",
    "Faixa de desconto atingida",
    "Meta atingida / prazo finalizado",
    "Ordem gerada — em negociação",
    "Venda concluída",
  ];

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-3xl space-y-5 pb-24 md:pb-0">
        <button onClick={() => navigate("/comprador/minhas-compras")} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600">
          <ArrowLeft size={15} /> Voltar
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
          <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {offer?.imageBase64 ? <img src={offer.imageBase64} alt={reservation!.product} className="w-full h-full object-cover" /> : <Package size={28} className="text-blue-300" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-blue-500" />
              <h1 className="text-lg font-bold text-gray-800">{reservation!.product}</h1>
            </div>
            <p className="text-sm text-gray-500">{reservation!.supplierSnapshot.companyName}</p>
            <div className="grid sm:grid-cols-2 gap-1 mt-2 text-sm">
              <p>Quantidade: <b>{reservation!.quantity.toLocaleString("pt-BR")} {reservation!.unit}</b></p>
              <p>Preço estimado: <b>{currency(reservation!.unitPrice)}/{reservation!.unit}</b></p>
              <p>Total estimado: <b className="text-blue-600">{currency(reservation!.totalAmount)}</b></p>
              <p>Economia estimada: <b className="text-green-600">{currency(economy)}</b></p>
            </div>
            <span className={`${badgeClass[reservation!.status] || "badge-aguardando_aprovacao"} mt-2 inline-block text-xs`}>
              {collectiveStatusLabel[reservation!.status] || reservation!.status}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4">Linha do tempo</h2>
          <div className="flex flex-col gap-3">
            {collectiveSteps.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i <= currentStep ? "bg-blue-500" : "bg-gray-200"}`} />
                <span className={`text-sm ${i <= currentStep ? "text-gray-800 font-medium" : "text-gray-400"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {offer && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-bold text-gray-800 mb-3">Dados da oferta</h2>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
              <p>Prazo: <b>{dateLabel(offer.deadline)}</b></p>
              <p>Condição: <b>{offer.paymentTerms}</b></p>
              <p>Região: <b>{offer.region}</b></p>
              <p>Entrega: <b>{offer.deliveryTime}</b></p>
              {offer.notes && <p className="sm:col-span-2">Obs: <b>{offer.notes}</b></p>}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <Info size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">{FACILITADORA_NOTICE}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {offer && (
            <Link to={`/ofertas/${offer.id}`} className="btn-secondary flex items-center gap-1.5 text-sm">
              <ExternalLink size={15} /> Ver oferta
            </Link>
          )}
          <button className="btn-secondary flex items-center gap-1.5 text-sm" onClick={() => window.print()}>
            <FileDown size={15} /> Baixar resumo
          </button>
          <button className="btn-secondary flex items-center gap-1.5 text-sm">
            <Headphones size={15} /> Suporte
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
