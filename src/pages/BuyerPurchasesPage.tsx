import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Package, ArrowLeft, FileDown, Headphones, ExternalLink } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency, dateLabel, offerProgress } from "../utils/business";
import type { ReservationStatus } from "../types";

const statusLabel: Record<ReservationStatus, string> = {
  reservado: "Aguardando meta",
  aguardando_meta: "Aguardando meta",
  em_andamento: "Aguardando meta",
  meta_batida: "Meta atingida",
  meta_atingida: "Meta atingida",
  confirmado: "Pedido confirmado",
  entregue: "Concluído",
  cancelado: "Cancelado",
};

const statusBadge: Record<ReservationStatus, string> = {
  reservado: "badge-aguardando_aprovacao",
  aguardando_meta: "badge-aguardando_aprovacao",
  em_andamento: "badge-aguardando_aprovacao",
  meta_batida: "badge-meta_atingida",
  meta_atingida: "badge-meta_atingida",
  confirmado: "badge-ativa",
  entregue: "badge-ativa",
  cancelado: "badge-cancelada",
};

const tabs = [
  { id: "andamento", label: "Reservas em andamento", statuses: ["reservado", "aguardando_meta", "em_andamento"] },
  { id: "meta", label: "Meta atingida", statuses: ["meta_atingida", "meta_batida"] },
  { id: "confirmado", label: "Pedidos confirmados", statuses: ["confirmado"] },
  { id: "concluido", label: "Compras concluídas", statuses: ["entregue"] },
  { id: "cancelado", label: "Canceladas/expiradas", statuses: ["cancelado"] },
] as const;

function daysLeft(deadline: string) {
  const diff = new Date(`${deadline}T23:59:59`).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function BuyerPurchasesPage() {
  const { session, reservations, offers } = useAppState();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("andamento");

  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const myReservations = reservations.filter(r => r.buyerId === session.id);

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-4 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Minhas compras</h1>
          <p className="text-sm text-gray-500 mt-0.5">Acompanhe tudo o que você reservou e comprou na Zuppi.</p>
        </div>

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

        {(() => {
          const current = tabs.find(t => t.id === activeTab)!;
          const list = myReservations.filter(r => current.statuses.includes(r.status as never));
          if (list.length === 0) {
            return <div className="card p-8 text-center text-gray-400">Nada por aqui ainda.</div>;
          }
          return (
            <div className="space-y-3">
              {list.map(reservation => {
                const offer = offers.find(o => o.id === reservation.offerId);
                const progress = offer ? offerProgress(offer) : null;
                return (
                  <article key={reservation.id} className="card p-4 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {offer?.imageBase64
                        ? <img src={offer.imageBase64} alt={reservation.product} className="w-full h-full object-cover" />
                        : <Package size={24} className="text-orange-300" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800">{reservation.product}</h3>
                      <p className="text-sm text-gray-500">Fornecedor: {reservation.supplierSnapshot.companyName}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Quantidade: <b>{reservation.quantity.toLocaleString("pt-BR")} {reservation.unit}</b> · Preço: <b>{currency(reservation.unitPrice)}</b> · Total: <b className="text-orange-600">{currency(reservation.totalAmount)}</b>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Reserva em {dateLabel(reservation.createdAt)}</p>
                      {progress && progress.percent < 100 && offer && (
                        <p className="text-xs text-gray-500 mt-1">Meta: {progress.percent}% atingida · Prazo: {daysLeft(offer.deadline)} dia(s) restantes</p>
                      )}
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                      <span className={statusBadge[reservation.status]}>{statusLabel[reservation.status]}</span>
                      <Link to={`/comprador/minhas-compras/${reservation.id}`} className="text-sm text-orange-600 font-semibold hover:underline">
                        Ver detalhes
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          );
        })()}
      </div>
    </DashboardLayout>
  );
}

// ─── PURCHASE DETAIL ────────────────────────────────────────────────────────

const timelineSteps = [
  { key: "reserva", label: "Reserva feita" },
  { key: "aguardando", label: "Aguardando meta" },
  { key: "meta", label: "Meta atingida" },
  { key: "confirmado", label: "Pedido confirmado" },
  { key: "entrega", label: "Em entrega" },
  { key: "concluido", label: "Concluído" },
];

function timelineIndex(status: ReservationStatus) {
  if (["reservado", "aguardando_meta", "em_andamento"].includes(status)) return 1;
  if (["meta_atingida", "meta_batida"].includes(status)) return 2;
  if (status === "confirmado") return 3;
  if (status === "entregue") return 5;
  return 0;
}

export function BuyerPurchaseDetailPage() {
  const { id } = useParams();
  const { session, reservations, offers } = useAppState();
  const navigate = useNavigate();

  if (!session || session.role !== "buyer") return <Navigate to="/auth?type=buyer" replace />;

  const reservation = useMemo(() => reservations.find(r => r.id === id && r.buyerId === session.id), [reservations, id, session.id]);

  if (!reservation) {
    return (
      <DashboardLayout role="buyer">
        <div className="card p-8 text-center">
          <p className="text-gray-500">Compra não encontrada.</p>
          <Link to="/comprador/minhas-compras" className="btn-primary mt-4 mx-auto">Voltar</Link>
        </div>
      </DashboardLayout>
    );
  }

  const offer = offers.find(o => o.id === reservation.offerId);
  const economy = offer ? reservation.quantity * (offer.normalPrice - reservation.unitPrice) : 0;
  const currentStep = timelineIndex(reservation.status);

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-3xl space-y-5">
        <button onClick={() => navigate("/comprador/minhas-compras")} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600">
          <ArrowLeft size={15} /> Voltar para minhas compras
        </button>

        {/* Summary */}
        <div className="card p-5 flex flex-col sm:flex-row gap-4">
          <div className="w-20 h-20 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {offer?.imageBase64
              ? <img src={offer.imageBase64} alt={reservation.product} className="w-full h-full object-cover" />
              : <Package size={32} className="text-orange-300" />}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{reservation.product}</h1>
            <p className="text-sm text-gray-500">Fornecedor: {reservation.supplierSnapshot.companyName}</p>
            <div className="grid sm:grid-cols-2 gap-1 mt-2 text-sm text-gray-600">
              <p>Quantidade: <b>{reservation.quantity.toLocaleString("pt-BR")} {reservation.unit}</b></p>
              <p>Preço unitário: <b>{currency(reservation.unitPrice)}</b></p>
              <p>Valor total: <b className="text-orange-600">{currency(reservation.totalAmount)}</b></p>
              <p>Economia estimada: <b className="text-green-700">{currency(economy)}</b></p>
            </div>
            <span className={`${statusBadge[reservation.status]} mt-2 inline-block`}>{statusLabel[reservation.status]}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-800 mb-4">Linha do tempo</h2>
          <div className="flex flex-col gap-3">
            {timelineSteps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i <= currentStep ? "bg-orange-500" : "bg-gray-200"}`} />
                <span className={`text-sm ${i <= currentStep ? "text-gray-800 font-medium" : "text-gray-400"}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Commercial data */}
        {offer && (
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 mb-3">Dados comerciais</h2>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
              <p>Prazo da oferta: <b>{dateLabel(offer.deadline)}</b></p>
              <p>Condição de pagamento: <b>{offer.paymentTerms}</b></p>
              <p>Região atendida: <b>{offer.region}</b></p>
              <p>Prazo de entrega: <b>{offer.deliveryTime}</b></p>
              <p>Compra mínima: <b>{offer.minimumPurchasePerBuyer} {offer.unit}</b></p>
              {offer.notes && <p className="sm:col-span-2">Observações do fornecedor: <b>{offer.notes}</b></p>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {offer && (
            <Link to={`/ofertas/${offer.id}`} className="btn-secondary">
              <ExternalLink size={15} /> Ver oferta original
            </Link>
          )}
          <button className="btn-secondary" onClick={() => window.print()}>
            <FileDown size={15} /> Baixar resumo
          </button>
          <button className="btn-secondary">
            <Headphones size={15} /> Falar com suporte
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
