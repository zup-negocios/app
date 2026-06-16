import { FormEvent, useState } from "react";
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
  Edit3, FileText, ChevronRight, Sparkles,
  AlertCircle, Calendar, MapPin, CreditCard, Truck, CheckCircle,
  Lock, Crown, ExternalLink, Info, ImagePlus, X,
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

function MetricCard({ title, value, sub, icon: Icon, iconBg = "bg-orange-50", iconColor = "text-orange-500" }: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export function SupplierDashboardPage() {
  const { session, suppliers, buyers, offers, reservations, requestOfferEdit } = useAppState();
  const navigate = useNavigate();
  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const supplier = suppliers.find(s => s.id === session.id);
  const myOffers = offers.filter(o => o.supplierId === session.id);
  const myOfferIds = new Set(myOffers.map(o => o.id));
  const myReservations = reservations.filter(r => myOfferIds.has(r.offerId));

  const activeOffers = myOffers.filter(o => ["ativa", "aberta"].includes(o.status)).length;
  const reachedOffers = myOffers.filter(o => o.status === "meta_atingida").length;
  const totalReservedAmount = myReservations.reduce((a, r) => a + r.totalAmount, 0);
  const uniqueBuyers = new Set(myReservations.map(r => r.buyerId)).size;
  const waiting = myReservations.filter(r => ["aguardando_meta", "em_andamento"].includes(r.status)).length;

  const buyerReport = buyers
    .map(buyer => {
      const bRes = myReservations.filter(r => r.buyerId === buyer.id);
      if (!bRes.length) return null;
      return {
        buyer,
        totalReservations: bRes.length,
        totalQuantity: bRes.reduce((a, r) => a + r.quantity, 0),
        totalValue: bRes.reduce((a, r) => a + r.totalAmount, 0),
        lastStatus: bRes[bRes.length - 1]?.status ?? "aguardando_meta",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.totalValue - a.totalValue);

  return (
    <DashboardLayout role="supplier">
      <div className="space-y-6 max-w-6xl">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Olá, {supplier?.contactName?.split(" ")[0] || "fornecedor"}!
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {supplier?.companyName} · Plano <span className="font-semibold text-orange-600 capitalize">{supplier?.planoFornecedor}</span>
            </p>
          </div>
          <button className="btn-primary" onClick={() => navigate("/fornecedor/criar-oferta")}>
            <PlusCircle size={16} /> Nova oferta
          </button>
        </div>

        {/* Metrics */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard title="Ofertas ativas" value={String(activeOffers)} sub={`${reachedOffers} meta(s) atingida(s)`} icon={TrendingUp} />
          <MetricCard title="Total reservado" value={currency(totalReservedAmount)} sub="valor potencial" icon={DollarSign} iconBg="bg-green-50" iconColor="text-green-600" />
          <MetricCard title="Compradores" value={String(uniqueBuyers)} sub="participantes" icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <MetricCard title="Aguardando meta" value={String(waiting)} sub="pré-pedidos" icon={Package} iconBg="bg-amber-50" iconColor="text-amber-600" />
        </div>

        {/* Pending actions */}
        {(() => {
          const alerts: string[] = [];
          const nearGoal = myOffers.find(o => ["ativa", "aberta"].includes(o.status) && offerProgress(o).percent >= 70 && offerProgress(o).percent < 100);
          if (nearGoal) alerts.push(`A oferta ${nearGoal.product} está com ${offerProgress(nearGoal).percent}% da meta atingida.`);
          if (waiting > 0) alerts.push(`Você tem ${waiting} pré-pedido(s) aguardando meta.`);
          const noImageCount = myOffers.filter(o => !o.imageBase64).length;
          if (noImageCount > 0) alerts.push(`Adicione foto em ${noImageCount} oferta(s) para melhorar a conversão.`);
          if (supplier?.planoFornecedor !== "assinante") alerts.push("Complete seus dados para liberar recursos do Plano Pro.");
          if (alerts.length === 0) return null;
          return (
            <section className="card p-4 space-y-2">
              <h2 className="font-bold text-gray-800 text-sm mb-1">Ações pendentes</h2>
              {alerts.map((text, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-amber-50/60 border border-amber-100 rounded-xl px-3 py-2">
                  <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{text}</span>
                </div>
              ))}
            </section>
          );
        })()}

        {/* My Offers */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">Minhas ofertas</h2>
            <Link to="/ofertas" className="text-sm text-orange-600 font-medium hover:text-orange-700 flex items-center gap-1">
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {myOffers.length === 0 && (
              <div className="card p-8 text-center">
                <Package size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="font-semibold text-gray-600">Nenhuma oferta ainda</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">Crie sua primeira oferta para começar a receber reservas.</p>
                <button className="btn-primary mx-auto" onClick={() => navigate("/fornecedor/criar-oferta")}>
                  <PlusCircle size={15} /> Criar oferta
                </button>
              </div>
            )}
            {myOffers.map(offer => {
              const progress = offerProgress(offer);
              const availability = offerAvailability(offer);
              const offerRes = myReservations.filter(r => r.offerId === offer.id);
              const pct = progress.percent;
              return (
                <div key={offer.id} className="card p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1 min-w-0 flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {offer.imageBase64
                          ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
                          : <Package size={20} className="text-orange-300" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-800">{offer.product}</h3>
                          <span className={statusColors[offer.status] || "badge-rascunho"}>
                            {offer.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{offer.brand} · {offer.category}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link className="btn-secondary text-xs py-1.5 px-3" to={`/fornecedor/ofertas/${offer.id}`}>
                        <Eye size={13} /> Detalhes
                      </Link>
                      <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => {
                        if (offerRes.length > 0) return requestOfferEdit(offer.id);
                        navigate(`/fornecedor/ofertas/${offer.id}?edit=1`);
                      }}>
                        <Edit3 size={13} /> Editar
                      </button>
                      <Link className="btn-primary text-xs py-1.5 px-3" to={`/fornecedor/ofertas/${offer.id}?report=1`}>
                        <FileText size={13} /> Relatório
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
                    <p>Compradores: <b className="text-gray-800">{new Set(offerRes.map(r => r.buyerId)).size}</b></p>
                    <p>Reservado: <b className="text-gray-800">{currency(offerRes.reduce((a, r) => a + r.totalAmount, 0))}</b></p>
                    <p>Disponível: <b className="text-gray-800">{availability.availablePercent}%</b></p>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progresso da meta</span>
                      <span className={pct >= 100 ? "text-green-600 font-bold" : "font-medium"}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-green-500" : "bg-orange-500"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatGoal(offer, progress.current)} de {formatGoal(offer, progress.target)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Buyer report */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">Relatório de compradores</h2>
            <span className="text-sm text-gray-500">{buyerReport.length} no total</span>
          </div>

          {supplier?.planoFornecedor !== "assinante" ? (
            <div className="card p-6 text-center border-dashed border-2 border-orange-200 bg-orange-50/50">
              <Lock size={28} className="mx-auto text-orange-400 mb-2" />
              <p className="font-bold text-gray-700">Dados dos compradores bloqueados</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Ative o Plano Pro para ver empresa, CNPJ, contato e histórico completo dos compradores.
              </p>
              <button className="btn-primary mx-auto">
                <Crown size={15} /> Ativar Plano Pro
              </button>
            </div>
          ) : buyerReport.length === 0 ? (
            <div className="card p-6 text-center text-gray-400">Nenhum comprador participando ainda.</div>
          ) : (
            <div className="card overflow-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Empresa", "Responsável", "Cidade", "Contato", "Reservas", "Qtd. Total", "Valor Potencial", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {buyerReport.map(item => (
                    <tr key={item.buyer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{item.buyer.companyName}</td>
                      <td className="px-4 py-3 text-gray-600">{item.buyer.contactName}</td>
                      <td className="px-4 py-3 text-gray-600">{item.buyer.city}</td>
                      <td className="px-4 py-3 text-gray-600">{item.buyer.whatsapp}</td>
                      <td className="px-4 py-3">{item.totalReservations}</td>
                      <td className="px-4 py-3">{item.totalQuantity}</td>
                      <td className="px-4 py-3 font-semibold text-orange-600">{currency(item.totalValue)}</td>
                      <td className="px-4 py-3">
                        <span className="badge-ativa">{reservationLabel[item.lastStatus] || item.lastStatus}</span>
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

export function SupplierCreateOfferPage() {
  const { session, addOffer, categories } = useAppState();
  const navigate = useNavigate();
  const [targetType, setTargetType] = useState<"quantity" | "amount">("quantity");
  const [normalPrice, setNormalPrice] = useState(0);
  const [productImage, setProductImage] = useState<string | null>(null);

  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const category = categories.find(c => c.id === String(data.get("categoryId")));
    const deadline = String(data.get("deadline"));
    const targetQuantity = targetType === "quantity" ? parseDecimal(data.get("targetQuantity")) : undefined;
    const targetAmount = targetType === "amount" ? parseDecimal(data.get("targetAmount")) : undefined;
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
      zuppiPrice: parseDecimal(data.get("zuppiPrice")),
      minGoal: targetType === "amount" ? targetAmount || 0 : targetQuantity || 0,
      minimumPurchasePerBuyer: parseDecimal(data.get("minimumPurchasePerBuyer")),
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

            <div className="card p-6 space-y-5">
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
              <div>
                <label className="label-base">Preço normal</label>
                <input
                  required name="normalPrice" inputMode="decimal"
                  placeholder="R$ 0,00" className="input-base w-full"
                  onChange={e => setNormalPrice(parseDecimal(e.target.value))}
                />
              </div>
              <div>
                <label className="label-base flex items-center gap-1">
                  Preço Zuppi <Info size={13} className="text-gray-400" />
                </label>
                <input required name="zuppiPrice" inputMode="decimal" placeholder="R$ 0,00" className="input-base w-full" />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label-base">Compra mínima por comprador</label>
                <input required name="minimumPurchasePerBuyer" inputMode="decimal" placeholder="Ex: 4" className="input-base w-full" />
              </div>
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
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label-base">Quantidade máxima</label>
                <input name="maxQty" inputMode="decimal" placeholder="Opcional" className="input-base w-full" />
              </div>
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
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-base flex items-center gap-1.5"><Calendar size={13} className="text-gray-400" />Prazo final da oferta</label>
                <input required type="date" name="deadline" min={todayInputValue()} max={maxOfferDeadlineInputValue()} className="input-base w-full" />
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

            <div>
              <label className="label-base">Observações</label>
              <textarea
                name="notes"
                placeholder="Ex: Oferta exclusiva para compradores B2B"
                maxLength={200}
                rows={3}
                className="input-base w-full resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
              <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => navigate("/fornecedor")}>
                Salvar rascunho
              </button>
              <button type="submit" className="btn-primary flex-1 justify-center">
                <ExternalLink size={15} /> Publicar oferta
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              🔒 Seus dados estão protegidos com criptografia de ponta a ponta.
            </p>
            </div>
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
  const { session, suppliers, offers, reservations } = useAppState();
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

        <div className="grid sm:grid-cols-4 gap-4">
          <MetricCard title="Meta" value={formatGoal(offer, progress.target)} icon={TrendingUp} />
          <MetricCard title="Reservado" value={formatGoal(offer, progress.current)} icon={Package} iconBg="bg-green-50" iconColor="text-green-600" />
          <MetricCard title="Valor reservado" value={currency(totalAmount)} icon={DollarSign} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <MetricCard title="Disponível" value={`${availability.availablePercent}%`} sub={`${availability.available} ${offer.unit}`} icon={Users} iconBg="bg-amber-50" iconColor="text-amber-600" />
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

const preOrderFilters = [
  { id: "todos", label: "Todos" },
  { id: "aguardando_meta", label: "Aguardando meta" },
  { id: "meta_atingida", label: "Meta atingida" },
  { id: "confirmado", label: "Confirmado" },
  { id: "cancelado", label: "Cancelado" },
  { id: "entregue", label: "Concluído" },
];

export function SupplierPreOrdersPage() {
  const { session, offers, reservations } = useAppState();
  const [filter, setFilter] = useState("todos");

  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const myOfferIds = new Set(offers.filter(o => o.supplierId === session.id).map(o => o.id));
  const myReservations = reservations.filter(r => myOfferIds.has(r.offerId));
  const filtered = filter === "todos" ? myReservations : myReservations.filter(r => r.status === filter);

  return (
    <DashboardLayout role="supplier">
      <div className="space-y-4 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pré-pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Reservas recebidas em todas as suas ofertas.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {preOrderFilters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                filter === f.id ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">Nenhum pré-pedido encontrado para este filtro.</div>
        ) : (
          <div className="card overflow-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Comprador", "Produto", "Quantidade", "Valor", "Status", "Data", "Ação"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => {
                  const offer = offers.find(o => o.id === r.offerId);
                  return (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{r.buyerSnapshot.companyName}</td>
                      <td className="px-4 py-3 text-gray-600">{r.product}</td>
                      <td className="px-4 py-3">{r.quantity} {r.unit}</td>
                      <td className="px-4 py-3 font-semibold text-orange-600">{currency(r.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className="badge-ativa text-xs">{reservationLabel[r.status] || r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 py-3">
                        {offer && (
                          <Link to={`/fornecedor/ofertas/${offer.id}`} className="text-orange-600 font-medium hover:underline text-xs">
                            Ver detalhes
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
