import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import {
  currency, formatGoal, maxOfferDeadlineInputValue, offerAvailability,
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
  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const supplier = suppliers.find(s => s.id === session.id);
  const myOffers = offers.filter(o => o.supplierId === session.id);
  const myOfferIds = new Set(myOffers.map(o => o.id));
  const myReservations = reservations.filter(r => myOfferIds.has(r.offerId));
  const myMarketOrders = marketOrders.filter(o => myOfferIds.has(o.offerId));

  const activeOffers = myOffers.filter(o => ["ativa", "aberta"].includes(o.status)).length;
  const reachedOffers = myOffers.filter(o => o.status === "meta_atingida").length;
  const totalReservedAmount = myReservations.reduce((a, r) => a + r.totalAmount, 0);
  const marketOrdersValue = myMarketOrders.reduce((a, o) => a + o.totalAmount, 0);
  const uniqueBuyers = new Set([...myReservations.map(r => r.buyerId), ...myMarketOrders.map(o => o.buyerId)]).size;
  const waiting = myReservations.filter(r => ["aguardando_meta", "em_andamento"].includes(r.status)).length;
  const pendingMarket = myMarketOrders.filter(o => ["ordem_gerada", "fornecedor_notificado"].includes(o.status)).length;

  // Priorities (max 3)
  const priorities = useMemo(() => {
    const items: { id: string; text: string; cta: string; href: string }[] = [];
    const sortedByProgress = [...myOffers]
      .filter(o => ["ativa", "aberta"].includes(o.status))
      .map(o => ({ offer: o, progress: offerProgress(o) }))
      .sort((a, b) => b.progress.percent - a.progress.percent);

    for (const { offer, progress } of sortedByProgress) {
      if (items.length >= 2) break;
      if (progress.percent >= 70 && progress.percent < 100) {
        const missingLabel = offer.targetType === "amount" ? currency(progress.missing) : `${progress.missing.toLocaleString("pt-BR")} ${offer.unit}`;
        items.push({ id: offer.id, text: `${offer.product} está com ${progress.percent}% da meta atingida. Faltam ${missingLabel}.`, cta: "Ver oferta", href: `/fornecedor/ofertas/${offer.id}` });
      }
    }
    const lowTraction = sortedByProgress.find(({ progress }) => progress.percent < 30);
    if (lowTraction && items.length < 3) {
      items.push({ id: `low-${lowTraction.offer.id}`, text: `${lowTraction.offer.product} tem baixa tração. Revise preço, foto ou prazo.`, cta: "Editar oferta", href: `/fornecedor/ofertas/${lowTraction.offer.id}?edit=1` });
    }
    if (waiting > 0 && items.length < 3) {
      items.push({ id: "waiting", text: `Você recebeu ${waiting} pré-pedido(s) aguardando meta.`, cta: "Ver pré-pedidos", href: "/fornecedor/pre-pedidos" });
    }
    return items.slice(0, 3);
  }, [myOffers, waiting]);

  const recentOffers = myOffers.slice(0, 5);
  const recentReservations = [...myReservations]
    .filter(r => r.purchaseMode !== "market")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout role="supplier">
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Olá, {supplier?.contactName?.split(" ")[0] || "fornecedor"}!
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {supplier?.companyName} · Plano <span className="font-medium text-gray-600 capitalize">{supplier?.planoFornecedor === "assinante" ? "Assinante" : "Gratuito"}</span>
            </p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/fornecedor/criar-oferta")}>
            <PlusCircle size={16} /> Nova oferta
          </button>
        </div>

        {/* Main metrics */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Ofertas ativas" value={String(activeOffers)} sub={`${reachedOffers} meta(s) atingida(s)`} icon={TrendingUp} />
          <MetricCard title="Coletivas" value={String(myReservations.length)} sub={`Intenções · ${currency(totalReservedAmount)}`} icon={Users} />
          <MetricCard title="Market Zuppi" value={String(myMarketOrders.length)} sub={`${pendingMarket} aguardando · ${currency(marketOrdersValue)}`} icon={DollarSign} />
          <MetricCard title="Compradores únicos" value={String(uniqueBuyers)} sub="participantes ativos" icon={Package} />
        </div>

        {/* Alert market orders */}
        {pendingMarket > 0 && (
          <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
            <span className="text-orange-500 font-bold text-sm">⚡</span>
            <p className="text-sm text-orange-700 font-medium">Você tem <b>{pendingMarket}</b> ordem(s) Market Zuppi aguardando sua atenção.</p>
            <Link to="/fornecedor/pre-pedidos" className="ml-auto text-xs font-bold text-orange-600 hover:underline">Ver agora</Link>
          </div>
        )}

        {/* Priorities of the day */}
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

        {/* My Offers — compact table */}
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
                    {["Produto", "Status", "Reservado", "Progresso", "Prazo", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOffers.map(offer => {
                    const progress = offerProgress(offer);
                    const offerRes = myReservations.filter(r => r.offerId === offer.id);
                    const daysLeft = Math.max(0, Math.ceil((new Date(`${offer.deadline}T23:59:59`).getTime() - Date.now()) / 86400000));
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
                              <p className="text-[11px] text-gray-400 truncate">{supplier?.companyName} · {offer.category}</p>
                            </div>
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
                        <td className="px-4 py-3 text-gray-500 text-xs">{daysLeft} dias</td>
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

        {/* Recent pre-orders — compact table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">Pré-pedidos recentes</h2>
            <Link to="/fornecedor/pre-pedidos" className="text-xs text-orange-500 font-semibold hover:text-orange-600">
              Ver todos
            </Link>
          </div>

          {recentReservations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              Nenhum pré-pedido recebido ainda.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Empresa", "Produto", "Qtd.", "Valor", "Status", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentReservations.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{r.buyerSnapshot.companyName}</p>
                        <p className="text-[11px] text-gray-400">{r.buyerSnapshot.city}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.product}</td>
                      <td className="px-4 py-3 text-gray-600">{r.quantity.toLocaleString("pt-BR")} {r.unit}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{currency(r.totalAmount)}</td>
                      <td className="px-4 py-3"><span className="badge-ativa text-xs">{reservationLabel[r.status] || r.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/fornecedor/pre-pedidos/${r.id}`} className="text-xs font-semibold text-orange-500 hover:text-orange-600">Ver</Link>
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

// ─── MARKET INTEL PANEL ───────────────────────────────────────────────────────

function MarketIntelPanel({ normalPrice }: { normalPrice: number }) {
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
        <p className="text-xs text-gray-500 mb-0.5">Preço sugerido Zuppi</p>
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
  const { session, addOffer, categories } = useAppState();
  const navigate = useNavigate();
  const [targetType, setTargetType] = useState<"quantity" | "amount">("quantity");
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
    const deadline = String(data.get("deadline"));
    const targetQuantity = targetType === "quantity" ? parseDecimal(data.get("targetQuantity")) : undefined;
    const targetAmount = targetType === "amount" ? parseDecimal(data.get("targetAmount")) : undefined;
    const validTiers = tiers.filter(t => t.percentage > 0 && t.price > 0);
    const collectiveMinQty = parseDecimal(data.get("collectiveMinQty")) || parseDecimal(data.get("minimumPurchasePerBuyer"));
    addOffer({
      supplierId: session.id,
      product: String(data.get("product")),
      brand: String(data.get("brand")),
      category: category?.name || "Outros",
      categoryId: category?.id || "outros",
      subcategory: String(data.get("subcategory") || ""),
      description: "",
      unit: String(data.get("unit")),
      normalPrice: parseDecimal(data.get("normalPrice")),
      zuppiPrice: validTiers.length > 0 ? Math.min(...validTiers.map(t => t.price)) : parseDecimal(data.get("zuppiPrice") || data.get("normalPrice")),
      minGoal: targetType === "amount" ? targetAmount || 0 : targetQuantity || 0,
      minimumPurchasePerBuyer: collectiveMinQty,
      targetType,
      targetQuantity,
      targetAmount,
      maxQty: parseDecimal(data.get("maxQty")) || undefined,
      deadline,
      region: String(data.get("region")),
      paymentTerms: String(data.get("paymentTerms")),
      deliveryTime: String(data.get("deliveryTime")),
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
    toast.success("Oferta cadastrada com sucesso.");
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
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-base">Unidade de venda</label>
                  <select required name="unit" className="input-base w-full">
                    {["saco 25kg", "kg", "unidade", "caixa", "pacote", "fardo", "litro", "metro", "tonelada"].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
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
                    required name="normalPrice" inputMode="decimal"
                    placeholder="R$ 0,00" className="input-base w-full"
                    onChange={e => setNormalPrice(parseDecimal(e.target.value))}
                  />
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
                    <p className="font-bold text-gray-800 text-sm flex items-center gap-1.5">⚡ Market Zuppi <span className="text-[10px] font-normal text-orange-600 bg-orange-100 rounded-full px-2 py-0.5">Compra imediata</span></p>
                    <p className="text-xs text-gray-500">Comprador adquire sem depender de meta coletiva.</p>
                  </div>
                </label>
                {marketEnabled && (
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label-base">Preço Market Zuppi</label>
                      <input name="marketPrice" inputMode="decimal" placeholder="R$ 0,00" className="input-base w-full"
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
                                    inputMode="decimal" value={tier.price || ""}
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
                      <p className="text-xs text-gray-400 mt-1.5">Dica: o preço de 100% deve ser o menor de todos. O valor mais baixo das faixas ativas será o preço Zuppi exibido.</p>
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
                  <label className="label-base">Tipo de meta</label>
                  <select value={targetType} onChange={e => setTargetType(e.target.value as "quantity" | "amount")} className="input-base w-full">
                    <option value="quantity">Meta por quantidade</option>
                    <option value="amount">Meta por valor (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="label-base">{targetType === "quantity" ? "Meta (quantidade)" : "Meta (R$)"}</label>
                  {targetType === "quantity"
                    ? <input required name="targetQuantity" inputMode="decimal" placeholder="Ex: 400" className="input-base w-full" />
                    : <input required name="targetAmount" inputMode="decimal" placeholder="Ex: 50000" className="input-base w-full" />
                  }
                </div>
                <div>
                  <label className="label-base">Compra mínima por comprador</label>
                  <input required name="minimumPurchasePerBuyer" inputMode="decimal" placeholder="Ex: 4" className="input-base w-full" />
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
                  <label className="label-base flex items-center gap-1.5"><MapPin size={13} className="text-gray-400" />Região atendida</label>
                  <input required name="region" placeholder="Ex: Curitiba e região" className="input-base w-full" />
                </div>
                <div>
                  <label className="label-base flex items-center gap-1.5"><CreditCard size={13} className="text-gray-400" />Condição de pagamento</label>
                  <select required name="paymentTerms" className="input-base w-full">
                    {["À vista (Pix)", "7 dias", "14 dias", "21 dias", "28 dias", "30 dias", "45 dias", "60 dias"].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base flex items-center gap-1.5"><Truck size={13} className="text-gray-400" />Prazo de entrega</label>
                  <select required name="deliveryTime" className="input-base w-full">
                    {["até 2 dias após fechamento", "até 3 dias após fechamento", "até 5 dias após fechamento", "até 7 dias após fechamento", "até 10 dias após fechamento", "até 15 dias após fechamento"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-base flex items-center gap-1.5"><Calendar size={13} className="text-gray-400" />Prazo final da oferta</label>
                  <input required type="date" name="deadline" min={todayInputValue()} max={maxOfferDeadlineInputValue()} className="input-base w-full" />
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

          <MarketIntelPanel normalPrice={normalPrice} />
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── OFFER DETAIL ──────────────────────────────────────────────────────────────

export function SupplierOfferDetailPage() {
  const { id } = useParams();
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
          <button className="btn-secondary" onClick={() => window.print()}>
            <FileText size={14} /> Imprimir / PDF
          </button>
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
            <h2 className="text-lg font-bold text-gray-800">Pré-pedidos da oferta</h2>
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

// ─── PRE-ORDERS (PRÉ-PEDIDOS) ─────────────────────────────────────────────────

type PreOrderTab = "todas" | "market" | "coletivas";

const marketStatusLabel: Record<string, string> = {
  ordem_gerada: "Ordem gerada",
  fornecedor_notificado: "Notificado",
  em_tratativa_com_fornecedor: "Em negociação",
  venda_concluida: "Concluída",
  cliente_nao_cumpriu: "Não cumpriu",
  cancelada: "Cancelada",
};

const collectiveStatusLabel: Record<string, string> = {
  aguardando_meta: "Aguardando meta",
  intencao_registrada: "Intenção registrada",
  faixa_atingida: "Faixa atingida",
  meta_atingida: "Meta atingida",
  ordem_gerada: "Ordem gerada",
  em_tratativa_com_fornecedor: "Em negociação",
  venda_concluida: "Concluída",
  cliente_nao_cumpriu: "Não cumpriu",
  cancelado: "Cancelada",
  confirmado: "Confirmado",
  entregue: "Concluído",
};

export function SupplierPreOrdersPage() {
  const { session, offers, reservations, marketOrders, updateMarketOrderStatus, updateReservationStatus, updateBuyerScore } = useAppState();
  const [tab, setTab] = useState<PreOrderTab>("todas");

  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const myOfferIds = new Set(offers.filter(o => o.supplierId === session.id).map(o => o.id));
  const myReservations = reservations.filter(r => myOfferIds.has(r.offerId) && r.purchaseMode !== "market");
  const myMarketOrders = marketOrders.filter(o => myOfferIds.has(o.offerId));

  const totalCollective = myReservations.reduce((a, r) => a + r.totalAmount, 0);
  const totalMarket = myMarketOrders.reduce((a, o) => a + o.totalAmount, 0);
  const uniqueBuyers = new Set([...myReservations.map(r => r.buyerId), ...myMarketOrders.map(o => o.buyerId)]).size;
  const pendingMarket = myMarketOrders.filter(o => ["ordem_gerada", "fornecedor_notificado"].includes(o.status)).length;

  const handleMarketAction = (orderId: string, buyerId: string, action: "concluir" | "nao_cumpriu" | "cancelar" | "negociar") => {
    if (action === "concluir") { updateMarketOrderStatus(orderId, "venda_concluida"); updateBuyerScore(buyerId, true); }
    else if (action === "nao_cumpriu") { updateMarketOrderStatus(orderId, "cliente_nao_cumpriu"); updateBuyerScore(buyerId, false); }
    else if (action === "cancelar") updateMarketOrderStatus(orderId, "cancelada");
    else updateMarketOrderStatus(orderId, "em_tratativa_com_fornecedor");
  };

  const handleCollectiveAction = (resId: string, buyerId: string, action: "concluir" | "nao_cumpriu" | "cancelar" | "negociar") => {
    if (action === "concluir") { updateReservationStatus(resId, "venda_concluida"); updateBuyerScore(buyerId, true); }
    else if (action === "nao_cumpriu") { updateReservationStatus(resId, "cliente_nao_cumpriu"); updateBuyerScore(buyerId, false); }
    else if (action === "cancelar") updateReservationStatus(resId, "cancelado");
    else updateReservationStatus(resId, "em_tratativa_com_fornecedor");
  };

  return (
    <DashboardLayout role="supplier">
      <div className="space-y-5 max-w-6xl pb-24 md:pb-0">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Ordens e intenções</h1>
          <p className="text-sm text-gray-400 mt-0.5">Market Zuppi e compras coletivas em andamento.</p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Market Zuppi" value={String(myMarketOrders.length)} sub={`${pendingMarket} aguardando · ${currency(totalMarket)}`} icon={DollarSign} />
          <MetricCard title="Intenções coletivas" value={String(myReservations.length)} sub={currency(totalCollective)} icon={Package} />
          <MetricCard title="Compradores únicos" value={String(uniqueBuyers)} icon={Users} />
          <MetricCard title="Valor total" value={currency(totalCollective + totalMarket)} sub="potencial" icon={TrendingUp} />
        </div>

        <div className="flex gap-2">
          {(["todas", "market", "coletivas"] as PreOrderTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-colors ${tab === t ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200"}`}>
              {t === "todas" ? "Todas" : t === "market" ? "⚡ Market" : "👥 Coletivas"}
            </button>
          ))}
        </div>

        {/* Market orders table */}
        {(tab === "todas" || tab === "market") && myMarketOrders.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">⚡ Market Zuppi <span className="text-xs font-normal text-gray-400">— Ordens de compra imediata</span></h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Comprador", "Tipo", "Produto", "Qtd.", "Valor", "Status", "Data", "Ações"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myMarketOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{o.buyerSnapshot.companyName}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.buyerType === "b2c" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{o.buyerType === "b2c" ? "B2C" : "B2B"}</span></td>
                      <td className="px-4 py-3 text-gray-600">{o.product}</td>
                      <td className="px-4 py-3">{o.quantity} {o.unit}</td>
                      <td className="px-4 py-3 font-semibold text-orange-600">{currency(o.totalAmount)}</td>
                      <td className="px-4 py-3"><span className="badge-ativa text-xs">{marketStatusLabel[o.status] || o.status}</span></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">
                        {!["venda_concluida", "cliente_nao_cumpriu", "cancelada"].includes(o.status) && (
                          <div className="flex gap-1 flex-wrap">
                            <button onClick={() => handleMarketAction(o.id, o.buyerId, "negociar")} className="text-[10px] border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50">Em negociação</button>
                            <button onClick={() => handleMarketAction(o.id, o.buyerId, "concluir")} className="text-[10px] border border-green-200 text-green-700 rounded-lg px-2 py-1 hover:bg-green-50">Concluir</button>
                            <button onClick={() => handleMarketAction(o.id, o.buyerId, "nao_cumpriu")} className="text-[10px] border border-red-200 text-red-600 rounded-lg px-2 py-1 hover:bg-red-50">Não cumpriu</button>
                          </div>
                        )}
                        {["venda_concluida"].includes(o.status) && <span className="text-xs text-green-600 font-semibold">✓ Concluída</span>}
                        {["cliente_nao_cumpriu", "cancelada"].includes(o.status) && <span className="text-xs text-red-500">✗ Encerrada</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Collective intents table */}
        {(tab === "todas" || tab === "coletivas") && myReservations.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">👥 Intenções coletivas <span className="text-xs font-normal text-gray-400">— Aguardando meta ou prazo</span></h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Comprador", "Tipo", "Produto", "Qtd.", "Valor est.", "Status", "Data", "Ações"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myReservations.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.buyerSnapshot.companyName}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.buyerType === "b2c" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{r.buyerType === "b2c" ? "B2C" : "B2B"}</span></td>
                      <td className="px-4 py-3 text-gray-600">{r.product}</td>
                      <td className="px-4 py-3">{r.quantity} {r.unit}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600">{currency(r.totalAmount)}</td>
                      <td className="px-4 py-3"><span className="badge-aguardando_aprovacao text-xs">{collectiveStatusLabel[r.status] || r.status}</span></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">
                        {["ordem_gerada", "em_tratativa_com_fornecedor"].includes(r.status) && (
                          <div className="flex gap-1 flex-wrap">
                            <button onClick={() => handleCollectiveAction(r.id, r.buyerId, "concluir")} className="text-[10px] border border-green-200 text-green-700 rounded-lg px-2 py-1 hover:bg-green-50">Concluir</button>
                            <button onClick={() => handleCollectiveAction(r.id, r.buyerId, "nao_cumpriu")} className="text-[10px] border border-red-200 text-red-600 rounded-lg px-2 py-1 hover:bg-red-50">Não cumpriu</button>
                          </div>
                        )}
                        {["venda_concluida", "confirmado", "entregue"].includes(r.status) && <span className="text-xs text-green-600 font-semibold">✓ Concluída</span>}
                        {["cliente_nao_cumpriu", "cancelado"].includes(r.status) && <span className="text-xs text-red-500">✗ Encerrada</span>}
                        {!["ordem_gerada", "em_tratativa_com_fornecedor", "venda_concluida", "confirmado", "entregue", "cliente_nao_cumpriu", "cancelado"].includes(r.status) && (
                          <Link to={`/fornecedor/pre-pedidos/${r.id}`} className="text-orange-600 text-xs font-medium hover:underline">Ver</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {myMarketOrders.length === 0 && myReservations.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            Nenhuma ordem ou intenção encontrada. <Link to="/fornecedor/criar-oferta" className="text-orange-600 font-semibold hover:underline ml-1">Criar oferta</Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
