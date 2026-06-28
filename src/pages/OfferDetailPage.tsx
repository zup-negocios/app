import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { Package, Zap, Users, CheckCircle, Info } from "lucide-react";
import { useAppState } from "../components/AppProvider";
import { DashboardLayout } from "../components/DashboardLayout";
import { OfferCountdown } from "../components/OfferCountdown";
import { ProgressBarMeta } from "../components/ProgressBarMeta";
import { StarRating } from "../components/StarRating";
import {
  currency, formatGoal, getBestCollectivePrice, getCurrentCollectivePrice,
  getMarketPrice, getNextTier, offerProgress,
} from "../utils/business";

const FACILITADORA_NOTICE = "A Zup atua como plataforma facilitadora de conexão comercial. Pagamento, emissão fiscal, retirada, entrega e demais condições operacionais devem ser tratados diretamente entre comprador e fornecedor.";

export function OfferDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { offers, session, reserve, createMarketOrder, getRatingSummary } = useAppState();
  const navigate = useNavigate();

  const offer = useMemo(() => offers.find((item) => item.id === id), [offers, id]);

  const defaultMode = searchParams.get("mode") === "market" ? "market" : "collective";
  const hasMarket = offer?.marketSaleEnabled;
  const hasCollective = offer?.collectiveSaleEnabled !== false;
  const hasTiers = (offer?.progressiveTiers?.length ?? 0) > 0;

  const [activeMode, setActiveMode] = useState<"market" | "collective">(
    hasMarket && defaultMode === "market" ? "market" : hasCollective ? "collective" : "market"
  );
  const [quantity, setQuantity] = useState(0);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [done, setDone] = useState(false);

  if (!offer) {
    const notFound = <main className="max-w-4xl mx-auto p-8 text-gray-500">Oferta não encontrada.</main>;
    return session ? <DashboardLayout role={session.role}>{notFound}</DashboardLayout> : notFound;
  }

  const progress = offerProgress(offer);
  const supplierRating = getRatingSummary(offer.supplierId, "supplier");
  const marketPrice = getMarketPrice(offer);
  const currentCollective = getCurrentCollectivePrice(offer);
  const bestCollective = getBestCollectivePrice(offer);
  const nextTier = getNextTier(offer);

  const unitPrice = activeMode === "market" ? marketPrice : currentCollective;
  const total = quantity * unitPrice;
  const economy = quantity * (offer.normalPrice - unitPrice);

  const handleBuy = () => {
    if (!session || session.role !== "buyer") {
      navigate("/auth?type=buyer");
      return;
    }
    if (activeMode === "market") {
      const result = createMarketOrder(offer.id, session.id, quantity, session.role === "buyer" ? undefined : undefined);
      setMessage({ text: result.message || "", ok: result.ok });
      if (result.ok) {
        setDone(true);
        setTimeout(() => navigate("/comprador/minhas-compras"), 1800);
      }
    } else {
      const result = reserve(offer.id, session.id, quantity);
      setMessage({ text: result.message || "", ok: result.ok });
      if (result.ok) {
        setDone(true);
        setTimeout(() => navigate("/comprador/minhas-compras"), 1800);
      }
    }
  };

  const content = (
    <div className="max-w-4xl mx-auto space-y-5 pb-24 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-44 h-44 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {offer.imageBase64
            ? <img src={offer.imageBase64} alt={offer.product} className="w-full h-full object-cover" />
            : <Package size={48} className="text-orange-300" />}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{offer.product}</h1>
          <p className="text-gray-500 mt-1">{offer.brand} — {offer.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
            <StarRating value={supplierRating.average} />
            <span>{supplierRating.count ? `${supplierRating.average.toFixed(1)} reputação do fornecedor` : "Fornecedor sem avaliações ainda"}</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">{offer.category}</span>
            {offer.region && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">{offer.region}</span>}
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">Preço normal: {currency(offer.normalPrice)}/{offer.unit}</span>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      {hasMarket && hasCollective && (
        <div className="flex gap-3">
          <button
            onClick={() => setActiveMode("market")}
            className={`flex-1 rounded-2xl border-2 p-4 text-left transition-all ${
              activeMode === "market"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-100 bg-white hover:border-orange-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-orange-500" />
              <span className="font-bold text-sm text-gray-800">Market Zup</span>
            </div>
            <p className="text-xl font-black text-orange-600">{currency(marketPrice)}<span className="text-xs font-normal text-gray-400">/{offer.unit}</span></p>
            <p className="text-xs text-gray-400 mt-1">Compra imediata, sem depender de meta</p>
          </button>
          <button
            onClick={() => setActiveMode("collective")}
            className={`flex-1 rounded-2xl border-2 p-4 text-left transition-all ${
              activeMode === "collective"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-100 bg-white hover:border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-blue-500" />
              <span className="font-bold text-sm text-gray-800">Coletiva</span>
            </div>
            <p className="text-xl font-black text-blue-600">{currency(currentCollective)}<span className="text-xs font-normal text-gray-400">/{offer.unit}</span></p>
            <p className="text-xs text-gray-400 mt-1">Melhor preço: {currency(bestCollective)}/{offer.unit}</p>
          </button>
        </div>
      )}

      {/* Market panel */}
      {(activeMode === "market" || !hasCollective) && hasMarket && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-orange-500" />
            <h2 className="font-bold text-gray-800">Comprar agora — Market Zup</h2>
          </div>
          <p className="text-sm text-gray-500">Compra imediata, sem depender da meta coletiva.</p>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <p>Preço: <b className="text-orange-600">{currency(marketPrice)}/{offer.unit}</b></p>
            <p>Mínimo: <b>{offer.marketMinimumQuantity ?? 1} {offer.unit}</b></p>
            {offer.deliveryTime && <p>Prazo: <b>{offer.deliveryTime}</b></p>}
            {offer.paymentTerms && <p>Condição: <b>{offer.paymentTerms}</b></p>}
          </div>

          {!done ? (
            <>
              <input
                type="number"
                min={offer.marketMinimumQuantity ?? 1}
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border border-gray-200 rounded-xl p-3 w-full text-sm"
                placeholder={`Quantidade (mín. ${offer.marketMinimumQuantity ?? 1} ${offer.unit})`}
              />
              {quantity > 0 && (
                <div className="text-sm space-y-1">
                  <p>Total: <b className="text-gray-800">{currency(total)}</b></p>
                  {economy > 0 && <p className="text-green-600">Economia: <b>{currency(economy)}</b> em relação ao preço normal</p>}
                </div>
              )}
              {message && <p className={`text-sm ${message.ok ? "text-green-600" : "text-red-500"}`}>{message.text}</p>}
              <button
                className="btn-primary w-full"
                disabled={!session || session.role !== "buyer" || quantity < (offer.marketMinimumQuantity ?? 1)}
                onClick={handleBuy}
              >
                {session?.role === "buyer" ? "Comprar agora" : "Entrar para comprar"}
              </button>
              {!session && <Link to="/auth?type=buyer" className="block text-center text-sm text-orange-600 hover:underline">Criar conta de comprador</Link>}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle size={32} className="text-green-500" />
              <p className="font-bold text-green-700">Ordem de compra gerada!</p>
              <p className="text-sm text-gray-500 text-center">O fornecedor foi notificado e dará sequência à negociação diretamente com você.</p>
            </div>
          )}
        </div>
      )}

      {/* Collective panel */}
      {(activeMode === "collective" || !hasMarket) && hasCollective && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            <h2 className="font-bold text-gray-800">Participar da compra coletiva</h2>
          </div>
          <p className="text-sm text-gray-500">Quanto mais compradores participam, menor o preço para todos.</p>

          {/* Tiers table */}
          {hasTiers && offer.progressiveTiers && (
            <div className="overflow-auto rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase">Faixa da meta</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase">Preço por {offer.unit}</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {offer.progressiveTiers.map((tier) => {
                    const reached = progress.percent >= tier.percentage;
                    const isCurrent = currentCollective === tier.price;
                    return (
                      <tr key={tier.percentage} className={`${isCurrent ? "bg-blue-50" : ""}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-700">{tier.percentage}%</td>
                        <td className={`px-4 py-2.5 font-bold ${isCurrent ? "text-blue-600" : "text-gray-800"}`}>{currency(tier.price)}</td>
                        <td className="px-4 py-2.5">
                          {reached ? (
                            <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">✓ Atingida</span>
                          ) : isCurrent ? (
                            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">Atual</span>
                          ) : (
                            <span className="text-xs text-gray-400">Aguardando</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Meta: <b>{formatGoal(offer, progress.target)}</b></span>
              <span className="font-bold text-orange-600">{progress.percent}%</span>
            </div>
            <ProgressBarMeta current={progress.current} total={progress.target} />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Reservado: {formatGoal(offer, progress.current)}</span>
              <span>Faltam: {formatGoal(offer, progress.missing)}</span>
            </div>
            {nextTier && (
              <p className="text-xs text-blue-600 font-medium">
                📈 Próxima faixa em {nextTier.percentage}%: {currency(nextTier.price)}/{offer.unit}
              </p>
            )}
            <OfferCountdown deadline={offer.deadline} />
          </div>

          {!done ? (
            <>
              <input
                type="number"
                min={offer.collectiveMinimumQuantity || offer.minimumPurchasePerBuyer}
                value={quantity || ""}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border border-gray-200 rounded-xl p-3 w-full text-sm"
                placeholder={`Quantidade (mín. ${offer.collectiveMinimumQuantity || offer.minimumPurchasePerBuyer} ${offer.unit})`}
              />
              {quantity > 0 && (
                <div className="text-sm space-y-1">
                  <p>Valor estimado: <b className="text-gray-800">{currency(total)}</b> <span className="text-gray-400">(ao preço atual de {currency(currentCollective)}/{offer.unit})</span></p>
                  <p className="text-green-600">Melhor cenário: <b>{currency(quantity * bestCollective)}</b> se meta 100% for atingida</p>
                </div>
              )}
              {message && <p className={`text-sm ${message.ok ? "text-green-600" : "text-red-500"}`}>{message.text}</p>}
              <button
                className="w-full py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors"
                disabled={!session || session.role !== "buyer" || quantity < (offer.collectiveMinimumQuantity || offer.minimumPurchasePerBuyer)}
                onClick={handleBuy}
              >
                {session?.role === "buyer" ? "Registrar intenção de compra" : "Entrar para participar"}
              </button>
              {!session && <Link to="/auth?type=buyer" className="block text-center text-sm text-orange-600 hover:underline">Criar conta de comprador</Link>}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle size={32} className="text-blue-500" />
              <p className="font-bold text-blue-700">Intenção de compra registrada!</p>
              <p className="text-sm text-gray-500 text-center">Quando a oferta encerrar, você será avisado sobre o preço final e a ordem gerada.</p>
            </div>
          )}
        </div>
      )}

      {/* Aviso facilitadora */}
      <div className="flex gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-4">
        <Info size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">{FACILITADORA_NOTICE}</p>
      </div>

      {offer.deliveryTime && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 text-sm space-y-1">
          <h3 className="font-bold text-gray-700 mb-2">Condições comerciais</h3>
          <p><span className="text-gray-400">Prazo:</span> {offer.deliveryTime}</p>
          <p><span className="text-gray-400">Condição de pagamento:</span> {offer.paymentTerms}</p>
          {offer.notes && <p><span className="text-gray-400">Obs:</span> {offer.notes}</p>}
        </div>
      )}
    </div>
  );

  if (session) return <DashboardLayout role={session.role}>{content}</DashboardLayout>;
  return <main className="max-w-4xl mx-auto p-4 md:p-8">{content}</main>;
}
