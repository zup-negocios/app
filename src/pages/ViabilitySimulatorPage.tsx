import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { currency } from "../utils/business";
import {
  Calculator, Scale, Target, Tag, CheckCircle, AlertTriangle,
  XCircle, Sparkles, Save, Send, Info
} from "lucide-react";

// ─── CALC ─────────────────────────────────────────────────────────────────────

interface SimInput {
  costPerUnit: number;
  freightPerUnit: number;
  zuppiTax: number;
  otherCosts: number;
  desiredMargin: number;
  lowestMarketPrice: number;
  targetQty: number;
  minPurchase: number;
}

interface SimResult {
  totalCost: number;
  breakEvenPrice: number;
  recommendedPrice: number;
  competitivePrice: number;
  minRevenue: number;
  recommendedRevenue: number;
  competitiveProfit: number;
  recommendedProfit: number;
  status: "inviavel" | "viavel" | "saudavel";
}

function calculate(i: SimInput): SimResult {
  const totalCost = i.costPerUnit + i.freightPerUnit + i.zuppiTax + i.otherCosts;
  const breakEvenPrice = totalCost;
  const recommendedPrice = i.desiredMargin > 0 ? totalCost / (1 - i.desiredMargin) : totalCost * 1.12;
  let competitivePrice = i.lowestMarketPrice > 0 ? i.lowestMarketPrice * 0.981 : totalCost * 1.08;
  if (competitivePrice < totalCost) competitivePrice = totalCost * 1.03;

  const minRevenue = i.targetQty * breakEvenPrice;
  const recommendedRevenue = i.targetQty * recommendedPrice;
  const competitiveProfit = (competitivePrice - totalCost) * i.targetQty;
  const recommendedProfit = (recommendedPrice - totalCost) * i.targetQty;

  const status: SimResult["status"] =
    competitivePrice < totalCost ? "inviavel"
    : competitivePrice < recommendedPrice ? "viavel"
    : "saudavel";

  return { totalCost, breakEvenPrice, recommendedPrice, competitivePrice, minRevenue, recommendedRevenue, competitiveProfit, recommendedProfit, status };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseNum(v: string) {
  const n = parseFloat(v.replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function MetricCard({ label, value, icon: Icon, iconBg = "bg-orange-50", iconColor = "text-orange-500" }: {
  label: string; value: string; icon: React.ElementType; iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  inviavel: {
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    textColor: "text-red-700",
    label: "Oferta inviável",
  },
  viavel: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
    textColor: "text-amber-700",
    label: "Oferta viável",
  },
  saudavel: {
    icon: CheckCircle,
    bg: "bg-green-50",
    border: "border-green-200",
    iconColor: "text-green-500",
    textColor: "text-green-700",
    label: "Oferta saudável",
  },
};

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const MARGIN_OPTIONS = [
  { label: "5%", value: 0.05 },
  { label: "8%", value: 0.08 },
  { label: "10%", value: 0.10 },
  { label: "12%", value: 0.12 },
  { label: "15%", value: 0.15 },
  { label: "20%", value: 0.20 },
];

export function ViabilitySimulatorPage() {
  const { session } = useAppState();
  if (!session || session.role !== "supplier") return <Navigate to="/auth?type=supplier" replace />;

  const [form, setForm] = useState({
    product: "Farinha de Trigo Especial 25kg",
    brand: "Tradição",
    category: "Alimentos > Farinhas",
    unit: "saco 25kg",
    targetQty: "400",
    minPurchase: "4",
    cost: "94,00",
    freight: "4,50",
    zuppiTax: "2,40",
    otherCosts: "0,00",
    margin: "0.12",
    lowestMarketPrice: "112,00",
    marketSource: "Mercado Livre",
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const result = useMemo<SimResult>(() => calculate({
    costPerUnit: parseNum(form.cost),
    freightPerUnit: parseNum(form.freight),
    zuppiTax: parseNum(form.zuppiTax),
    otherCosts: parseNum(form.otherCosts),
    desiredMargin: parseFloat(form.margin),
    lowestMarketPrice: parseNum(form.lowestMarketPrice),
    targetQty: parseNum(form.targetQty),
    minPurchase: parseNum(form.minPurchase),
  }), [form]);

  const statusCfg = STATUS_CONFIG[result.status];
  const StatusIcon = statusCfg.icon;

  const chartData = [
    { name: "Custo total", value: result.totalCost, color: "#9CA3AF" },
    { name: "Preço competitivo", value: result.competitivePrice, color: "#F97316" },
    { name: "Menor p. mercado", value: parseNum(form.lowestMarketPrice), color: "#EA580C" },
    { name: "Preço recomendado", value: result.recommendedPrice, color: "#FB923C" },
  ];

  const aiMessage = `Para destravar volume e permanecer competitivo, publique a oferta entre ${currency(result.competitivePrice)} e ${currency(result.recommendedPrice)} por unidade.\n\nSe o objetivo for ganho de margem, mantenha ${currency(result.recommendedPrice)}.\n\nSe o objetivo for tração e aquisição de compradores, ${currency(result.competitivePrice)} é um ponto de entrada agressivo.`;

  return (
    <DashboardLayout role="supplier">
      <div className="max-w-[1200px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Simulador de viabilidade da oferta</h1>
          <p className="text-sm text-gray-500 mt-1">Descubra o preço mínimo viável e o faturamento necessário para sua oferta.</p>
        </div>

        <div className="grid lg:grid-cols-[480px_1fr] gap-6 items-start">
          {/* ─── FORM ─── */}
          <div className="card p-6 space-y-5">
            {/* Product info */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-base">Produto</label>
                <input value={form.product} onChange={e => set("product", e.target.value)} className="input-base w-full" />
              </div>
              <div>
                <label className="label-base">Marca</label>
                <input value={form.brand} onChange={e => set("brand", e.target.value)} className="input-base w-full" />
              </div>
              <div>
                <label className="label-base">Categoria</label>
                <input value={form.category} onChange={e => set("category", e.target.value)} className="input-base w-full" />
              </div>
            </div>

            {/* Unit & goal */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-base">Unidade de venda</label>
                <select value={form.unit} onChange={e => set("unit", e.target.value)} className="input-base w-full">
                  {["saco 25kg", "kg", "unidade", "caixa", "pacote", "fardo", "litro"].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base">Meta da oferta</label>
                <input
                  value={form.targetQty}
                  onChange={e => set("targetQty", e.target.value)}
                  inputMode="decimal" className="input-base w-full"
                />
                {parseNum(form.targetQty) > 0 && form.unit.includes("25kg") && (
                  <p className="text-xs text-orange-500 mt-0.5">≈ {(parseNum(form.targetQty) * 25).toLocaleString("pt-BR")} kg</p>
                )}
              </div>
              <div>
                <label className="label-base">Compra mínima</label>
                <input value={form.minPurchase} onChange={e => set("minPurchase", e.target.value)} inputMode="decimal" className="input-base w-full" />
              </div>
            </div>

            {/* Costs */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Custos por {form.unit}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-base">Custo do produto</label>
                  <input value={form.cost} onChange={e => set("cost", e.target.value)} inputMode="decimal" placeholder="R$ 0,00" className="input-base w-full" />
                </div>
                <div>
                  <label className="label-base">Frete / logística</label>
                  <input value={form.freight} onChange={e => set("freight", e.target.value)} inputMode="decimal" placeholder="R$ 0,00" className="input-base w-full" />
                </div>
                <div>
                  <label className="label-base flex items-center gap-1">
                    Taxa operacional Zuppi <Info size={12} className="text-gray-400" />
                  </label>
                  <input value={form.zuppiTax} onChange={e => set("zuppiTax", e.target.value)} inputMode="decimal" placeholder="R$ 0,00" className="input-base w-full" />
                </div>
                <div>
                  <label className="label-base">Outros custos</label>
                  <input value={form.otherCosts} onChange={e => set("otherCosts", e.target.value)} inputMode="decimal" placeholder="R$ 0,00" className="input-base w-full" />
                </div>
              </div>
            </div>

            {/* Margin & market */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label-base">Margem desejada</label>
                <select value={form.margin} onChange={e => set("margin", e.target.value)} className="input-base w-full">
                  {MARGIN_OPTIONS.map(o => (
                    <option key={o.value} value={String(o.value)}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base">Menor preço de mercado</label>
                <input value={form.lowestMarketPrice} onChange={e => set("lowestMarketPrice", e.target.value)} inputMode="decimal" placeholder="R$ 0,00" className="input-base w-full" />
              </div>
              <div>
                <label className="label-base">Origem de referência</label>
                <select value={form.marketSource} onChange={e => set("marketSource", e.target.value)} className="input-base w-full">
                  {["Mercado Livre", "Google Shopping", "Lojas online", "Outro"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2 flex items-start gap-2">
              <Info size={13} className="text-gray-400 flex-shrink-0 mt-0.5" />
              Os valores são por {form.unit}. Todos os cálculos são estimativas e podem variar conforme negociação e condições logísticas.
            </p>
          </div>

          {/* ─── ANALYSIS ─── */}
          <div className="space-y-4">
            {/* Top 4 metric cards */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Custo total por saco" value={currency(result.totalCost)} icon={Calculator} />
              <MetricCard label="Preço de equilíbrio" value={currency(result.breakEvenPrice)} icon={Scale} iconBg="bg-blue-50" iconColor="text-blue-500" />
              <MetricCard label="Preço recomendado (margem)" value={currency(result.recommendedPrice)} icon={Target} iconBg="bg-green-50" iconColor="text-green-500" />
              <MetricCard label="Preço competitivo sugerido" value={currency(result.competitivePrice)} icon={Tag} iconBg="bg-purple-50" iconColor="text-purple-500" />
            </div>

            {/* Status banner */}
            <div className={`rounded-2xl border ${statusCfg.border} ${statusCfg.bg} px-4 py-3 flex items-center gap-3`}>
              <StatusIcon size={20} className={statusCfg.iconColor} />
              <div>
                <span className={`font-bold text-sm ${statusCfg.textColor}`}>{statusCfg.label}</span>
                <span className={`text-sm ${statusCfg.textColor} ml-2`}>
                  Com preço de {currency(result.competitivePrice)} a oferta{" "}
                  {result.status === "inviavel"
                    ? "está abaixo do custo. Ajuste os valores."
                    : result.status === "viavel"
                    ? "continua positiva, mas abaixo da margem ideal."
                    : "atende à margem desejada e é competitiva."}
                </span>
              </div>
            </div>

            {/* Revenue cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <p className="text-xs text-gray-500 mb-0.5">Faturamento mínimo para a meta</p>
                <p className="text-xl font-bold text-gray-800">{currency(result.minRevenue)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{form.targetQty} × {currency(result.totalCost)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500 mb-0.5">Faturamento recomendado</p>
                <p className="text-xl font-bold text-gray-800">{currency(result.recommendedRevenue)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{form.targetQty} × {currency(result.recommendedPrice)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500 mb-0.5">Lucro est. (preço competitivo)</p>
                <p className={`text-xl font-bold ${result.competitiveProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {currency(result.competitiveProfit)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{form.targetQty} × {currency(result.competitivePrice - result.totalCost)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500 mb-0.5">Lucro est. (preço recomendado)</p>
                <p className="text-xl font-bold text-green-600">{currency(result.recommendedProfit)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{form.targetQty} × {currency(result.recommendedPrice - result.totalCost)}</p>
              </div>
            </div>

            {/* Chart + AI side by side */}
            <div className="grid md:grid-cols-[1fr_240px] gap-4">
              {/* Bar chart */}
              <div className="card p-4">
                <p className="text-sm font-bold text-gray-700 mb-3">Comparativo de preços por saco</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                    <XAxis
                      type="number"
                      domain={[Math.min(...chartData.map(d => d.value)) * 0.95, Math.max(...chartData.map(d => d.value)) * 1.05]}
                      tickFormatter={v => `${v.toFixed(0)}`}
                      tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "#6B7280" }} />
                    <Tooltip
                      formatter={(v) => [currency(Number(v)), "Preço"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* AI suggestion */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-orange-500" />
                  <span className="text-sm font-bold text-gray-800">Sugestão da IA</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{aiMessage}</p>
                <span className="inline-block text-[10px] bg-amber-50 text-amber-600 font-medium px-2 py-0.5 rounded-full border border-amber-100">
                  ⚠ Dados simulados
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="btn-secondary flex-1 justify-center">
                <Save size={14} /> Salvar simulação
              </button>
              <button className="btn-primary flex-1 justify-center">
                <Send size={14} /> Aplicar à oferta
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
