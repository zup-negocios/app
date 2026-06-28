import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAppState } from "../components/AppProvider";
import {
  Package, Users, Target, Trophy, TrendingDown, Shield, Clock, Store,
  ChevronRight, Star, Zap, CheckCircle, ArrowRight
} from "lucide-react";

// ─── COUNTER ─────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);
  return count;
}

function StatCounter({ value, prefix = "", suffix = "", label }: { value: number; prefix?: string; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const count = useCountUp(value, 1800, active);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const display = prefix === "R$"
    ? `R$ ${count.toLocaleString("pt-BR")}`
    : `${count.toLocaleString("pt-BR")}${suffix}`;

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl md:text-4xl font-black text-orange-600">{display}</p>
      <p className="text-sm text-gray-500 mt-1 font-medium">{label}</p>
    </div>
  );
}

const STEPS = [
  { icon: Package, num: "01", title: "Fornecedor publica", desc: "Cadastra o produto com preço especial e define a meta mínima de volume." },
  { icon: Users, num: "02", title: "Compradores reservam", desc: "Compradores B2B entram na oferta e reservam a quantidade que precisam." },
  { icon: Target, num: "03", title: "Meta é atingida", desc: "Quando o volume coletivo atinge a meta, a oferta é desbloqueada." },
  { icon: Trophy, num: "04", title: "Todo mundo ganha", desc: "Fornecedor vende mais volume. Comprador paga menos. Simples assim." },
];

const BUYER_BENEFITS = [
  { icon: TrendingDown, title: "Preços até 40% menores", desc: "Preços de atacado sem precisar comprar em grandes volumes sozinho." },
  { icon: Shield, title: "Compra organizada e segura", desc: "Pedidos documentados, fornecedores verificados pela Zuppi." },
  { icon: Clock, title: "Oferta por tempo limitado", desc: "Aproveite enquanto a meta não é atingida." },
  { icon: Store, title: "Ideal para pequenos negócios", desc: "Padarias, restaurantes, petshops e muito mais." },
];

const SUPPLIER_BENEFITS = [
  "Mais volume por oferta", "Novos compradores B2B", "Giro de estoque acelerado",
  "Relatório de demanda", "Sem custo de prospecção", "IA de precificação",
  "Previsibilidade de venda", "Canal novo de vendas",
];

const PLANS = [
  {
    name: "Gratuito", price: "R$ 0", period: "/mês", highlight: false,
    features: ["1 oferta ativa por vez", "Dados resumidos de compradores", "Suporte por e-mail"],
    cta: "Começar grátis", href: "/auth?type=supplier",
  },
  {
    name: "Pro", price: "R$ 197", period: "/mês", highlight: true,
    features: ["Ofertas ilimitadas", "Dados completos dos compradores", "Exportar relatório PDF e CSV", "IA de precificação", "Destaque nas buscas", "Suporte prioritário"],
    cta: "Assinar Pro", href: "/auth?type=supplier",
  },
  {
    name: "Enterprise", price: "Sob consulta", period: "", highlight: false,
    features: ["Tudo do Pro", "API de integração", "Onboarding dedicado", "SLA garantido"],
    cta: "Falar com vendas", href: "/auth",
  },
];

export function HomePage() {
  const { offers, categories, session } = useAppState();
  const highlighted = offers.filter(o => o.approved && ["ativa", "aberta", "meta_atingida"].includes(o.status)).slice(0, 3);

  if (session) return <Navigate to={session.role === "buyer" ? "/comprador" : "/fornecedor"} replace />;

  return (
    <div className="bg-white">
      {/* ─── HERO ─── */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
            <Zap size={14} /> Plataforma B2B de compras coletivas
          </span>
          <h1 className="text-5xl md:text-6xl font-black leading-tight text-gray-900">
            O futuro das<br />
            vendas <span className="text-orange-500">B2B</span> é{" "}
            <span className="text-orange-500">coletivo.</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            A Zuppi conecta fornecedores e compradores profissionais em compras coletivas que geram mais volume, melhores preços e mais oportunidades.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/auth?type=buyer" className="btn-primary text-base px-6 py-3">
              Sou comprador <ArrowRight size={16} />
            </Link>
            <Link to="/auth?type=supplier" className="btn-secondary text-base px-6 py-3">
              Sou fornecedor
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Grátis para começar</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> Sem cartão de crédito</span>
            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> 5 minutos para publicar</span>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-black text-orange-400">Z</span>
              <span className="text-xl font-bold">uppi</span>
              <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">● Ao vivo</span>
            </div>
            <p className="text-2xl font-bold mb-1">Compre junto.</p>
            <p className="text-2xl font-bold text-orange-400 mb-4">Pague menos.</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-400">{highlighted.length}</p>
                <p className="text-xs text-gray-300 mt-0.5">ofertas</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-400">+300</p>
                <p className="text-xs text-gray-300 mt-0.5">compradores</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-400">40%</p>
                <p className="text-xs text-gray-300 mt-0.5">economia</p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg">
            <Trophy size={40} className="text-white" />
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="bg-orange-50 border-y border-orange-100 py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter value={1247890} prefix="R$" label="Negociados na plataforma" />
          <StatCounter value={89} suffix="" label="Ofertas ativas agora" />
          <StatCounter value={342} suffix="+" label="Compradores cadastrados" />
          <StatCounter value={47} label="Fornecedores ativos" />
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900">Como funciona</h2>
          <p className="text-gray-500 mt-2">Em 4 passos simples, do fornecedor ao comprador</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="hidden md:block absolute top-10 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-0.5 border-t-2 border-dashed border-orange-200" />
          {STEPS.map(({ icon: Icon, num, title, desc }) => (
            <div key={num} className="relative text-center group">
              <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                <Icon size={28} className="text-white" />
              </div>
              <div className="absolute -top-3 -right-1 text-5xl font-black text-orange-100 select-none pointer-events-none z-0">{num}</div>
              <h3 className="font-bold text-gray-800 mt-4 relative z-10">{title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed relative z-10">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOR BUYERS ─── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wide">Para compradores</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">Compre junto.<br /><span className="text-orange-500">Pague menos.</span></h2>
            <p className="text-gray-600 mt-4 leading-relaxed">Junte-se a outros compradores e desbloqueie preços exclusivos que só são possíveis em escala coletiva.</p>
            <Link to="/auth?type=buyer" className="btn-primary mt-6">
              Quero comprar com desconto <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {BUYER_BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                  <Icon size={20} className="text-orange-500" />
                </div>
                <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR SUPPLIERS ─── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wide">Para fornecedores</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">Venda mais volume<br />com menos esforço.</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {SUPPLIER_BENEFITS.map(b => (
              <div key={b} className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">{b}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/auth?type=supplier" className="btn-primary text-base px-8 py-3 mx-auto">
              Publicar minha primeira oferta <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-8">Explore por categoria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.filter(c => c.active).slice(0, 12).map(c => (
              <Link
                key={c.id}
                to={`/ofertas?cat=${c.id}`}
                className="bg-white rounded-xl p-4 text-center border border-gray-100 hover:border-orange-300 hover:shadow-md hover:bg-orange-50 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-orange-100 transition-colors">
                  <Package size={20} className="text-orange-400" />
                </div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">{c.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {offers.filter(o => o.categoryId === c.id && o.approved).length} ofertas
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-black text-gray-900 text-center mb-8">O que dizem sobre a Zuppi</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Carlos Souza", company: "Padaria Pão Bom", text: "Economizei 30% na compra de farinha. Em 3 dias a meta estava batida!", stars: 5 },
              { name: "Ana Costa", company: "Moinho Brasil", text: "Publiquei minha primeira oferta e já tive 8 compradores. Incrível.", stars: 5 },
              { name: "Marina Lima", company: "Restaurante Sabor Real", text: "A plataforma é simples e funciona. Minha reserva foi confirmada no prazo.", stars: 5 },
            ].map(t => (
              <div key={t.name} className="card p-5 space-y-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 italic leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="text-sm font-bold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLANS ─── */}
      <section className="bg-gray-50 py-20" id="planos">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">Planos para fornecedores</h2>
            <p className="text-gray-500 mt-2">Comece grátis, escale quando precisar</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`bg-white rounded-2xl p-6 border-2 relative ${p.highlight ? "border-orange-500 shadow-xl shadow-orange-100" : "border-gray-100"}`}>
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">Mais popular</span>
                )}
                <h3 className="font-bold text-lg text-gray-800">{p.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-black text-gray-900">{p.price}</span>
                  <span className="text-gray-500 text-sm">{p.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to={p.href} className={`w-full justify-center ${p.highlight ? "btn-primary" : "btn-secondary"}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="bg-orange-500 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Pronto para começar?</h2>
          <p className="text-orange-100 mb-8">Junte-se a centenas de empresas que já compram e vendem de forma coletiva.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth?type=buyer" className="bg-white text-orange-600 font-bold px-8 py-3 rounded-xl hover:bg-orange-50 transition-colors inline-flex items-center gap-2">
              Criar conta grátis <ArrowRight size={16} />
            </Link>
            <Link to="/ofertas" className="border-2 border-white/50 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Explorar ofertas
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xl font-black text-orange-400">Z</span>
              <span className="text-lg font-bold text-white">uppi</span>
            </div>
            <p className="text-sm leading-relaxed">O futuro das vendas B2B é coletivo.</p>
          </div>
          {[
            { title: "Plataforma", links: [{ l: "Como funciona", h: "/" }, { l: "Para compradores", h: "/auth?type=buyer" }, { l: "Para fornecedores", h: "/auth?type=supplier" }, { l: "Planos", h: "#planos" }] },
            { title: "Acesso", links: [{ l: "Entrar como comprador", h: "/auth?type=buyer" }, { l: "Entrar como fornecedor", h: "/auth?type=supplier" }, { l: "Ver ofertas", h: "/ofertas" }] },
            { title: "Contato", links: [{ l: "contato@zuppi.com.br", h: "#" }, { l: "+55 41 4000-0000", h: "#" }, { l: "Curitiba, PR", h: "#" }] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-3 text-sm">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(({ l, h }) => (
                  <li key={l}><Link to={h} className="text-sm hover:text-orange-400 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-8 pt-8 border-t border-gray-800 text-xs text-center">
          © 2026 Zuppi. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
