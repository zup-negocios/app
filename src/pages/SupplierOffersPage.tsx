import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Eye, Package, PlusCircle } from "lucide-react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency, formatGoal, offerProgress } from "../utils/business";

const statusColors: Record<string, string> = {
  ativa: "badge-ativa",
  aberta: "badge-ativa",
  rascunho: "badge-rascunho",
  meta_atingida: "badge-meta_atingida",
  cancelada: "badge-cancelada",
  aguardando_aprovacao: "badge-aguardando_aprovacao",
  pausada: "badge-pausada",
};

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

// ─── MY OFFERS (FULL PAGE) ─────────────────────────────────────────────────────

type OfferSortMode = "progresso" | "prazo";

export function SupplierOffersPage() {
  const { session, offers, reservations, requestOfferEdit } = useAppState();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [sortBy, setSortBy] = useState<OfferSortMode>("progresso");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const myOffers = offers.filter(o => o.supplierId === session.id);
  const myOfferIds = new Set(myOffers.map(o => o.id));
  const myReservations = reservations.filter(r => myOfferIds.has(r.offerId));

  const list = useMemo(() => {
    const filtered = myOffers.filter(o => {
      if (statusFilter !== "todos" && o.status !== statusFilter) return false;
      const search = query.trim().toLowerCase();
      if (!search) return true;
      return o.product.toLowerCase().includes(search) || o.category.toLowerCase().includes(search);
    });
    return filtered.sort((a, b) => {
      if (sortBy === "prazo") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      return offerProgress(b).percent - offerProgress(a).percent;
    });
  }, [myOffers, query, statusFilter, sortBy]);

  return (
    <DashboardLayout role="supplier">
      <div className="space-y-5 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Minhas ofertas</h1>
            <p className="text-sm text-gray-400 mt-0.5">Acompanhe suas ofertas, metas, reservas e desempenho.</p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/fornecedor/criar-oferta")}>
            <PlusCircle size={16} /> Nova oferta
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar produto"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 min-w-[180px]"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option value="todos">Todos os status</option>
            {["ativa", "aberta", "meta_atingida", "pausada", "rascunho", "cancelada"].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as OfferSortMode)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option value="progresso">Ordenar por progresso</option>
            <option value="prazo">Ordenar por prazo</option>
          </select>
        </div>

        {list.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Nenhuma oferta encontrada para os filtros selecionados.
          </div>
        ) : (
          <>
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Produto", "Categoria", "Status", "Preço Zup", "Reservado", "Meta", "Progresso", "Compradores", "Prazo", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {list.map(offer => {
                    const progress = offerProgress(offer);
                    const offerRes = myReservations.filter(r => r.offerId === offer.id);
                    const daysLeft = Math.max(0, Math.ceil((new Date(`${offer.deadline}T23:59:59`).getTime() - Date.now()) / 86400000));
                    return (
                      <tr key={offer.id} className="hover:bg-gray-50/50 relative">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {offer.imageBase64
                                ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
                                : <Package size={14} className="text-orange-300" />}
                            </div>
                            <p className="font-medium text-gray-800 truncate max-w-[160px]">{offer.product}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{offer.category}</td>
                        <td className="px-4 py-3"><span className={statusColors[offer.status] || "badge-rascunho"}>{offer.status.replace(/_/g, " ")}</span></td>
                        <td className="px-4 py-3 text-gray-700">{currency(offer.zuppiPrice)}</td>
                        <td className="px-4 py-3 text-gray-700">{currency(offerRes.reduce((a, r) => a + r.totalAmount, 0))}</td>
                        <td className="px-4 py-3 text-gray-500">{formatGoal(offer, progress.target)}</td>
                        <td className="px-4 py-3">
                          <div className="w-20">
                            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1">
                              <div className={`h-full rounded-full ${progress.percent >= 100 ? "bg-green-500" : "bg-orange-500"}`} style={{ width: `${Math.min(progress.percent, 100)}%` }} />
                            </div>
                            <span className="text-[11px] text-gray-400">{progress.percent}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Set(offerRes.map(r => r.buyerId)).size}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{daysLeft} dias</td>
                        <td className="px-4 py-3 text-right relative">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/fornecedor/ofertas/${offer.id}`} className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400">
                              <Eye size={14} />
                            </Link>
                            <button
                              onClick={() => setOpenMenu(openMenu === offer.id ? null : offer.id)}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400"
                            >
                              &#8942;
                            </button>
                          </div>
                          {openMenu === offer.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
                              <div className="absolute right-4 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 text-left">
                                <Link to="/fornecedor/pedidos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Ver pedidos</Link>
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  onClick={() => {
                                    setOpenMenu(null);
                                    if (offerRes.length > 0) return requestOfferEdit(offer.id);
                                    navigate(`/fornecedor/ofertas/${offer.id}?edit=1`);
                                  }}
                                >
                                  Editar oferta
                                </button>
                                <Link to={`/fornecedor/ofertas/${offer.id}?report=1`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Gerar relatório</Link>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Pausar oferta</button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {list.map(offer => {
                const progress = offerProgress(offer);
                const offerRes = myReservations.filter(r => r.offerId === offer.id);
                return (
                  <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {offer.imageBase64
                          ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
                          : <Package size={16} className="text-orange-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{offer.product}</p>
                        <span className={statusColors[offer.status] || "badge-rascunho"}>{offer.status.replace(/_/g, " ")}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-500 flex justify-between">
                      <span>Reservado: <b className="text-gray-700">{currency(offerRes.reduce((a, r) => a + r.totalAmount, 0))}</b></span>
                      <span>{progress.percent}%</span>
                    </div>
                    <Link to={`/fornecedor/ofertas/${offer.id}`} className="btn-secondary w-full justify-center mt-3 text-sm">Ver detalhes</Link>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── PRE-ORDER DETAIL ──────────────────────────────────────────────────────────

const preOrderTimelineSteps = [
  { key: "reserva", label: "Reserva recebida" },
  { key: "aguardando", label: "Aguardando meta" },
  { key: "meta", label: "Meta atingida" },
  { key: "confirmado", label: "Pedido confirmado" },
  { key: "entrega", label: "Em entrega" },
  { key: "concluido", label: "Concluído" },
];

function preOrderTimelineIndex(status: string) {
  if (["reservado", "aguardando_meta", "em_andamento"].includes(status)) return 1;
  if (["meta_atingida", "meta_batida"].includes(status)) return 2;
  if (status === "confirmado") return 3;
  if (status === "entregue") return 5;
  return 0;
}

export function SupplierPreOrderDetailPage() {
  const { id } = useParams();
  const { session, reservations, offers } = useAppState();
  const navigate = useNavigate();

  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const reservation = reservations.find(r => r.id === id && r.supplierId === session.id);

  if (!reservation) {
    return (
      <DashboardLayout role="supplier">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-gray-400">Pedido não encontrado.</p>
          <Link to="/fornecedor/pedidos" className="btn-primary mt-4 mx-auto">Voltar</Link>
        </div>
      </DashboardLayout>
    );
  }

  const offer = offers.find(o => o.id === reservation.offerId);
  const currentStep = preOrderTimelineIndex(reservation.status);

  return (
    <DashboardLayout role="supplier">
      <div className="max-w-3xl space-y-5">
        <button onClick={() => navigate("/fornecedor/pedidos")} className="text-sm text-gray-500 hover:text-orange-600">
          ← Voltar para pedidos
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-3">Dados do comprador</h2>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <p>Empresa: <b className="text-gray-800">{reservation.buyerSnapshot.companyName}</b></p>
            <p>CNPJ: <b className="text-gray-800">{reservation.buyerSnapshot.cnpj}</b></p>
            <p>Responsável: <b className="text-gray-800">{reservation.buyerSnapshot.contactName}</b></p>
            <p>Cidade: <b className="text-gray-800">{reservation.buyerSnapshot.city}</b></p>
            <p>Segmento: <b className="text-gray-800">{reservation.buyerSnapshot.segment}</b></p>
            <p>WhatsApp: <b className="text-gray-800">{reservation.buyerSnapshot.whatsapp}</b></p>
            <p>E-mail: <b className="text-gray-800">{reservation.buyerSnapshot.email}</b></p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-3">Dados da reserva</h2>
          <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
            <p>Produto: <b className="text-gray-800">{reservation.product}</b></p>
            <p>Marca: <b className="text-gray-800">{reservation.brand}</b></p>
            <p>Quantidade: <b className="text-gray-800">{reservation.quantity.toLocaleString("pt-BR")} {reservation.unit}</b></p>
            <p>Preço unitário: <b className="text-gray-800">{currency(reservation.unitPrice)}</b></p>
            <p>Valor total: <b className="text-orange-600">{currency(reservation.totalAmount)}</b></p>
            <p>Data da reserva: <b className="text-gray-800">{new Date(reservation.createdAt).toLocaleDateString("pt-BR")}</b></p>
            {offer && <p>Condição de pagamento: <b className="text-gray-800">{offer.paymentTerms}</b></p>}
            {offer && <p>Prazo de entrega: <b className="text-gray-800">{offer.deliveryTime}</b></p>}
          </div>
          <span className="badge-ativa mt-3 inline-block">{reservationLabel[reservation.status] || reservation.status}</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4">Linha do tempo</h2>
          <div className="flex flex-col gap-3">
            {preOrderTimelineSteps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i <= currentStep ? "bg-orange-500" : "bg-gray-200"}`} />
                <span className={`text-sm ${i <= currentStep ? "text-gray-800 font-medium" : "text-gray-400"}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" onClick={() => window.print()}>Gerar PDF</button>
          <button className="btn-primary">Confirmar pedido</button>
          <button className="btn-secondary">Marcar como entregue</button>
          <button className="btn-secondary text-red-600">Cancelar</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
