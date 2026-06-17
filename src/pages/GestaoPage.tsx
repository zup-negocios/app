import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { useAppState } from "../components/AppProvider";
import { currency, lastMonthOptions, monthKey, monthLabel } from "../utils/business";
import {
  Users, Building2, Tag, ShoppingCart, Target, TrendingUp, Clock,
  AlertTriangle, CheckCircle, ChevronRight, LogOut, LayoutDashboard,
  FileText, DollarSign, Settings, Crown
} from "lucide-react";

// ─── COUNTER ─────────────────────────────────────────────────────────────────

function useCountUp(target: number, active = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    const step = target / 80;
    let v = 0;
    const t = setInterval(() => {
      v += step;
      if (v >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(v));
    }, 20);
    return () => clearInterval(t);
  }, [target, active]);
  return val;
}

function AnimatedKpi({ value, label, isCurrency = false }: { value: number; label: string; isCurrency?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const count = useCountUp(value, active);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-black text-white">
        {isCurrency ? `R$ ${count.toLocaleString("pt-BR")}` : count.toLocaleString("pt-BR")}
      </p>
      <p className="text-orange-200 text-sm mt-1">{label}</p>
    </div>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

type GestaoSection = "dashboard" | "compradores" | "fornecedores" | "ofertas" | "negociacoes" | "financeiro" | "relatorios" | "configuracoes";

const NAV: { icon: React.ElementType; label: string; section: GestaoSection }[] = [
  { icon: LayoutDashboard, label: "Dashboard", section: "dashboard" },
  { icon: Users, label: "Compradores", section: "compradores" },
  { icon: Building2, label: "Fornecedores", section: "fornecedores" },
  { icon: Tag, label: "Ofertas", section: "ofertas" },
  { icon: ShoppingCart, label: "Negociações", section: "negociacoes" },
  { icon: DollarSign, label: "Financeiro", section: "financeiro" },
  { icon: FileText, label: "Relatórios", section: "relatorios" },
  { icon: Settings, label: "Configurações", section: "configuracoes" },
];

function GestaoSidebar({ section, setSection }: { section: GestaoSection; setSection: (s: GestaoSection) => void }) {
  const { logout } = useAppState();
  const navigate = useNavigate();
  return (
    <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-gray-900 flex-shrink-0">
      <div className="px-5 py-4 border-b border-gray-700/60">
        <div className="flex items-center gap-2 mb-2">
          <img src="/assets/zuppi-icon.png" alt="Zuppi" className="h-8 w-8 rounded-lg" />
          <span className="text-xl font-black text-white tracking-tight">uppi</span>
        </div>
        <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full tracking-wide">GESTÃO INTERNA</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ icon: Icon, label, section: s }) => {
          const active = section === s;
          return (
            <button key={s} onClick={() => setSection(s)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left
                ${active ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"}`}
              style={active ? { borderLeft: "3px solid #F97316", paddingLeft: "9px" } : {}}>
              <Icon size={17} className={active ? "text-orange-400" : "group-hover:text-orange-400"} />
              {label}
            </button>
          );
        })}
      </nav>
      <div className="px-3 pb-4 border-t border-gray-700/60 pt-3">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
            <Crown size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Equipe Zuppi</p>
            <p className="text-[10px] text-gray-500 truncate">gestor@zuppi.com.br</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate("/login"); }}
          className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-xs text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-colors">
          <LogOut size={14} /> Sair
        </button>
      </div>
    </aside>
  );
}

// ─── CHARTS DATA ─────────────────────────────────────────────────────────────

const weeklyData = [
  { week: "Sem 1", valor: 87420 }, { week: "Sem 2", valor: 124300 },
  { week: "Sem 3", valor: 198750 }, { week: "Sem 4", valor: 267890 },
  { week: "Sem 5", valor: 389200 }, { week: "Sem 6", valor: 521400 },
  { week: "Sem 7", valor: 834600 }, { week: "Sem 8", valor: 1247890 },
];

const monthlyOffers = [
  { mes: "Jan", ofertas: 3 }, { mes: "Fev", ofertas: 7 }, { mes: "Mar", ofertas: 12 },
  { mes: "Abr", ofertas: 18 }, { mes: "Mai", ofertas: 24 }, { mes: "Jun", ofertas: 31 },
];

const PIE_COLORS = ["#F97316", "#FB923C", "#FDBA74", "#FED7AA", "#FFF7ED", "#EA580C"];

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, color = "orange", alert = false, onClick }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string; alert?: boolean; onClick?: () => void;
}) {
  const bg: Record<string, string> = {
    orange: "bg-orange-50", blue: "bg-blue-50", green: "bg-green-50",
    yellow: "bg-yellow-50", purple: "bg-purple-50", teal: "bg-teal-50",
    amber: "bg-amber-50",
  };
  const ic: Record<string, string> = {
    orange: "text-orange-500", blue: "text-blue-500", green: "text-green-500",
    yellow: "text-yellow-500", purple: "text-purple-500", teal: "text-teal-500",
    amber: "text-amber-500",
  };
  return (
    <div onClick={onClick} className={`card p-5 flex items-start gap-3 ${onClick ? "cursor-pointer hover:shadow-md" : ""} ${alert ? "border-yellow-200 bg-yellow-50/50" : ""} transition-shadow`}>
      <div className={`w-9 h-9 rounded-xl ${bg[color]} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={ic[color]} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">{sub}</p>}
      </div>
      {alert && Number(value) > 0 && <span className="ml-auto w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0 mt-1.5" />}
    </div>
  );
}

// ─── LIVE COUNTER ─────────────────────────────────────────────────────────────

function LiveCounter({ count }: { count: number }) {
  const [display, setDisplay] = useState(count);
  useEffect(() => {
    const t = setInterval(() => {
      setDisplay(v => v + Math.floor(Math.random() * 2));
    }, 8000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="card p-6 border-2 border-orange-200 relative overflow-hidden">
      <div className="absolute inset-0 rounded-2xl border-2 border-orange-300 animate-ping opacity-20" />
      <div className="relative text-center">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full mb-3">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> AO VIVO
        </span>
        <p className="text-5xl font-black text-orange-600">{display.toLocaleString("pt-BR")}</p>
        <p className="text-gray-500 text-sm mt-1">Negociações fechadas hoje</p>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function GestaoPage() {
  const { buyers, suppliers, offers, reservations, updateSupplierApproval, updateSupplierPlan } = useAppState();
  const [section, setSection] = useState<GestaoSection>("dashboard");
  const [reportMonth, setReportMonth] = useState(lastMonthOptions()[0].key);

  const totalReserved = reservations.reduce((a, r) => a + r.totalAmount, 0);
  const activeOffers = offers.filter(o => ["ativa", "aberta"].includes(o.status));
  const pendingSuppliers = suppliers.filter(s => !s.approved);
  const reachedOffers = offers.filter(o => o.status === "meta_atingida");
  const avgTicket = reservations.length ? totalReserved / reservations.length : 0;

  const categoryDistrib = offers.reduce<Record<string, number>>((acc, o) => {
    acc[o.category] = (acc[o.category] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(categoryDistrib)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const projectedRevenue = totalReserved * 0.8;
  const zuppiCommission = projectedRevenue * 0.025;
  const monthlyGoal = 50000;

  const sectionLabel: Record<GestaoSection, string> = {
    dashboard: "Dashboard", compradores: "Compradores", fornecedores: "Fornecedores",
    ofertas: "Ofertas", negociacoes: "Negociações", financeiro: "Financeiro",
    relatorios: "Relatórios", configuracoes: "Configurações",
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <GestaoSidebar section={section} setSection={setSection} />
      <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-auto min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-3 sticky top-0 z-10 flex-shrink-0">
          <h1 className="font-bold text-gray-800">{sectionLabel[section]}</h1>
          <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">Acesso interno</span>
          <button onClick={() => window.open("/", "_blank")} className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <ChevronRight size={13} className="rotate-180" /> Ver site
          </button>
        </header>

        <main className="p-6 space-y-6 max-w-[1400px] w-full">
          {/* ── SECTIONS OTHER THAN DASHBOARD ── */}
          {section === "compradores" && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">Compradores cadastrados</h3>
                <p className="text-xs text-gray-400 mt-0.5">{buyers.length} no total</p>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{["Empresa","CNPJ","Cidade","Segmento","E-mail","WhatsApp"].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {buyers.map(b=>(
                      <tr key={b.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{b.companyName}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{b.cnpj}</td>
                        <td className="px-4 py-3 text-gray-500">{b.city}</td>
                        <td className="px-4 py-3 capitalize text-gray-500">{b.segment}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{b.email}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{b.whatsapp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === "fornecedores" && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">Fornecedores</h3>
                <p className="text-xs text-gray-400 mt-0.5">{suppliers.length} cadastrados · {suppliers.filter(s=>!s.approved).length} pendentes</p>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{["Empresa","Cidade","Tipo","Plano","Status","Ações"].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {suppliers.map(s=>(
                      <tr key={s.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{s.companyName}</td>
                        <td className="px-4 py-3 text-gray-500">{s.city}</td>
                        <td className="px-4 py-3 text-gray-500 capitalize">{s.supplierType}</td>
                        <td className="px-4 py-3">
                          <button onClick={()=>updateSupplierPlan(s.id, s.planoFornecedor==="assinante"?"gratuito":"assinante")}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${s.planoFornecedor==="assinante"?"bg-orange-100 text-orange-700 hover:bg-orange-200":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                            {s.planoFornecedor}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={()=>updateSupplierApproval(s.id,!s.approved)}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${s.approved?"bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700":"bg-yellow-100 text-yellow-700 hover:bg-green-100 hover:text-green-700"}`}>
                            {s.approved?"Ativo":"Pendente"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-xs text-orange-600">{s.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === "ofertas" && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">Todas as ofertas</h3>
                <p className="text-xs text-gray-400 mt-0.5">{offers.length} cadastradas</p>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{["Produto","Fornecedor","Categoria","Preço","Meta","Status"].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {offers.map(o=>{
                      const sup = suppliers.find(s=>s.id===o.supplierId);
                      return (
                        <tr key={o.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium">{o.product}</td>
                          <td className="px-4 py-3 text-gray-500">{sup?.companyName||"—"}</td>
                          <td className="px-4 py-3 text-gray-500 capitalize">{o.category}</td>
                          <td className="px-4 py-3 font-semibold text-orange-600">{currency(o.zuppiPrice)}/{o.unit}</td>
                          <td className="px-4 py-3 text-gray-500">{o.minGoal} {o.unit}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${o.status==="ativa"||o.status==="aberta"?"bg-green-100 text-green-700":o.status==="aguardando_aprovacao"?"bg-yellow-100 text-yellow-700":"bg-gray-100 text-gray-600"}`}>
                              {o.status.replace(/_/g," ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === "negociacoes" && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">Negociações / Pré-pedidos</h3>
                <p className="text-xs text-gray-400 mt-0.5">{reservations.length} no total · {currency(reservations.reduce((a,r)=>a+r.totalAmount,0))} em negociação</p>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>{["Produto","Comprador","Fornecedor","Qtd","Valor","Status"].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reservations.map(r=>{
                      const sup = suppliers.find(s=>s.id===r.supplierId);
                      return (
                        <tr key={r.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium">{r.product}</td>
                          <td className="px-4 py-3 text-gray-600">{r.buyerSnapshot.companyName}</td>
                          <td className="px-4 py-3 text-gray-500">{sup?.companyName||"—"}</td>
                          <td className="px-4 py-3">{r.quantity} {r.unit}</td>
                          <td className="px-4 py-3 font-semibold text-orange-600">{currency(r.totalAmount)}</td>
                          <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{r.status.replace(/_/g," ")}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === "financeiro" && (
            <div className="space-y-4">
              {[
                { label: "Volume total reservado", value: currency(reservations.reduce((a,r)=>a+r.totalAmount,0)), color: "text-orange-600" },
                { label: "Projeção de conversão (80%)", value: currency(reservations.reduce((a,r)=>a+r.totalAmount,0)*0.8), color: "text-gray-800" },
                { label: "Receita estimada Zuppi (2,5%)", value: currency(reservations.reduce((a,r)=>a+r.totalAmount,0)*0.8*0.025), color: "text-green-600" },
                { label: "Ticket médio por pré-pedido", value: reservations.length ? currency(reservations.reduce((a,r)=>a+r.totalAmount,0)/reservations.length) : "—", color: "text-gray-800" },
              ].map(({label,value,color})=>(
                <div key={label} className="card p-5 flex items-center justify-between">
                  <p className="text-sm text-gray-600">{label}</p>
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center">⚠ Valores baseados em dados simulados</p>
            </div>
          )}

          {section === "relatorios" && (() => {
            const monthReservations = reservations.filter(r => monthKey(r.createdAt) === reportMonth);
            const monthOffers = offers.filter(o => monthKey(o.createdAt) === reportMonth);
            const monthTotal = monthReservations.reduce((a, r) => a + r.totalAmount, 0);
            const monthBuyers = new Set(monthReservations.map(r => r.buyerId)).size;
            const monthSuppliers = new Set(monthOffers.map(o => o.supplierId)).size;

            return (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-800">Relatório mensal da plataforma</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Resultado consolidado de compradores e fornecedores por mês.</p>
                  </div>
                  <select value={reportMonth} onChange={e => setReportMonth(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                    {lastMonthOptions().map(m => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <KpiCard title="Volume negociado" value={currency(monthTotal)} icon={DollarSign} color="orange" />
                  <KpiCard title="Pré-pedidos no mês" value={monthReservations.length} icon={ShoppingCart} color="purple" />
                  <KpiCard title="Compradores ativos" value={monthBuyers} icon={Users} color="blue" />
                  <KpiCard title="Fornecedores com ofertas novas" value={monthSuppliers} icon={Building2} color="green" />
                </div>

                <div className="card">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Pré-pedidos em {monthLabel(reportMonth)}</h3>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>{["Produto", "Comprador", "Fornecedor", "Qtd", "Valor", "Data", "Status"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {monthReservations.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nenhum pré-pedido neste mês.</td></tr>
                        ) : monthReservations.map(r => {
                          const sup = suppliers.find(s => s.id === r.supplierId);
                          return (
                            <tr key={r.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 font-medium">{r.product}</td>
                              <td className="px-4 py-3 text-gray-600">{r.buyerSnapshot.companyName}</td>
                              <td className="px-4 py-3 text-gray-500">{sup?.companyName || "—"}</td>
                              <td className="px-4 py-3">{r.quantity} {r.unit}</td>
                              <td className="px-4 py-3 font-semibold text-orange-600">{currency(r.totalAmount)}</td>
                              <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</td>
                              <td className="px-4 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{r.status.replace(/_/g, " ")}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-center">
                  <button className="btn-primary mx-auto" onClick={() => window.print()}>Exportar relatório (PDF)</button>
                </div>
              </div>
            );
          })()}

          {section === "configuracoes" && (
            <div className="card p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <Settings size={24} className="text-orange-400" />
              </div>
              <h3 className="font-bold text-gray-700 text-lg">Configurações</h3>
              <p className="text-sm text-gray-400 mt-2">Em desenvolvimento — disponível em breve.</p>
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {section === "dashboard" && <>
          {/* Hero metric */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
            <p className="text-orange-100 text-sm font-medium mb-2">Total negociado na plataforma</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <AnimatedKpi value={totalReserved} label="volume reservado" isCurrency />
              <AnimatedKpi value={reservations.length} label="pré-pedidos" />
              <AnimatedKpi value={buyers.length + suppliers.length} label="usuários cadastrados" />
              <AnimatedKpi value={reachedOffers.length} label="metas atingidas" />
            </div>
          </div>

          {/* KPIs row 1 */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard title="Compradores cadastrados" value={buyers.length} sub="+12 esse mês" icon={Users} color="blue" />
            <KpiCard title="Fornecedores aprovados" value={suppliers.filter(s => s.approved).length} sub="+3 esse mês" icon={Building2} color="green" />
            <KpiCard title="Aguardando aprovação" value={pendingSuppliers.length} icon={Clock} color="yellow" alert={pendingSuppliers.length > 0} />
            <KpiCard title="Ofertas ativas" value={activeOffers.length} icon={Tag} color="orange" />
          </div>

          {/* KPIs row 2 + live counter */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
            <KpiCard title="Pré-pedidos gerados" value={reservations.length} icon={ShoppingCart} color="purple" />
            <KpiCard title="Aguardando meta" value={reservations.filter(r => r.status === "aguardando_meta").length} icon={Clock} color="amber" />
            <KpiCard title="Metas atingidas" value={reachedOffers.length} icon={Target} color="green" />
            <KpiCard title="Ticket médio" value={currency(avgTicket)} icon={TrendingUp} color="teal" />
            <LiveCounter count={reachedOffers.length * 3 + reservations.length} />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Volume chart */}
            <div className="lg:col-span-2 card p-5">
              <h3 className="font-bold text-gray-800 mb-4">Volume negociado (últimas 8 semanas)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <Tooltip formatter={(v) => [currency(Number(v)), "Volume"]} contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #E5E7EB" }} />
                  <Area type="monotone" dataKey="valor" stroke="#F97316" strokeWidth={2.5} fill="url(#orangeGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie chart */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 mb-4">Distribuição por categoria</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Bar chart */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-800 mb-4">Novas ofertas por mês</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyOffers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="ofertas" fill="#F97316" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Projection */}
            <div className="card p-5 space-y-4">
              <h3 className="font-bold text-gray-800">Projeção financeira</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Em negociação</span>
                  <span className="font-bold text-gray-800">{currency(totalReserved)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Projeção de conversão (80%)</span>
                  <span className="font-bold text-gray-800">{currency(projectedRevenue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-orange-50 rounded-xl px-3">
                  <span className="text-sm font-semibold text-orange-700">Estimativa receita Zuppi (2,5%)</span>
                  <span className="font-black text-orange-600 text-lg">{currency(zuppiCommission)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Meta mensal</span>
                  <span>{Math.min(100, Math.round(zuppiCommission / monthlyGoal * 100))}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (zuppiCommission / monthlyGoal) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{currency(zuppiCommission)} de {currency(monthlyGoal)} da meta mensal</p>
              </div>
              <p className="text-[10px] text-gray-400">⚠ Projeção baseada em dados simulados</p>
            </div>
          </div>

          {/* Alerts */}
          {pendingSuppliers.length > 0 && (
            <div className="card p-5 border-l-4 border-yellow-400 bg-yellow-50/50">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-500" />
                Ações pendentes
              </h3>
              <div className="space-y-2">
                {pendingSuppliers.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-yellow-100 last:border-0">
                    <p className="text-sm text-gray-700">Fornecedor <b>"{s.companyName}"</b> aguardando aprovação</p>
                    <button onClick={()=>setSection("fornecedores")} className="text-xs text-orange-600 font-semibold hover:underline flex items-center gap-1">
                      Aprovar <ChevronRight size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent suppliers table */}
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Fornecedores recentes</h3>
              <button onClick={()=>setSection("fornecedores")} className="text-xs text-orange-600 font-medium hover:underline">Ver todos</button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Empresa", "Cidade", "Tipo", "Plano", "Status", "Ações"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {suppliers.slice(0, 8).map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium">{s.companyName}</td>
                      <td className="px-4 py-3 text-gray-500">{s.city}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{s.supplierType}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.planoFornecedor === "assinante" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
                          {s.planoFornecedor}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {s.approved ? "Ativo" : "Pendente"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={()=>setSection("fornecedores")} className="text-xs text-orange-600 hover:underline">Gerenciar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent reservations */}
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Pré-pedidos recentes</h3>
              <span className="text-xs text-gray-400">{reservations.length} no total</span>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Produto", "Comprador", "Qtd", "Valor", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reservations.slice(0, 10).map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium">{r.product}</td>
                      <td className="px-4 py-3 text-gray-600">{r.buyerSnapshot.companyName}</td>
                      <td className="px-4 py-3">{r.quantity} {r.unit}</td>
                      <td className="px-4 py-3 font-semibold text-orange-600">{currency(r.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          {r.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center py-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <CheckCircle size={13} className="text-green-400" />
            Painel de gestão exclusivo Zuppi · Acesso restrito à equipe interna
          </div>
          </>}
        </main>
      </div>
    </div>
  );
}
