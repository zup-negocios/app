import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useAppState } from "../components/AppProvider";

const FEATURES = [
  { icon: ShoppingBag, text: "Compras coletivas com preços de atacado" },
  { icon: TrendingUp, text: "Acompanhe metas e economias em tempo real" },
  { icon: Users, text: "+300 empresas já economizaram na Zuppi" },
];

export function LoginPage() {
  const { session, login } = useAppState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to={session.role === "buyer" ? "/comprador" : "/fornecedor"} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 350));
    const em = email.trim().toLowerCase();
    if (em === "gestor@zuppi.com.br") { navigate("/gestao"); return; }
    if (em === "admin@zuppi.com.br") { navigate("/admin"); return; }
    const role = em.includes("fornecedor") || em.includes("moinho") || em.includes("higieniza") ? "supplier" : "buyer";
    const result = login(role, email, password);
    setLoading(false);
    if (!result.ok) { setError(result.message || "E-mail ou senha inválidos."); return; }
    navigate(role === "buyer" ? "/comprador" : "/fornecedor");
  };

  const quickLogin = (em: string, pw: string, path: string) => {
    if (em === "gestor@zuppi.com.br") { navigate("/gestao"); return; }
    const role = path.includes("comprador") ? "buyer" : "supplier";
    const result = login(role, em, pw);
    if (result.ok) navigate(path);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex flex-1 flex-col lg:flex-row">

        {/* LEFT — brand panel */}
        <div className="relative flex flex-col items-center justify-center lg:w-[54%] bg-[#FFF7F0] px-8 py-14 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-orange-100/60 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-orange-200/30 -translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center lg:items-start gap-7 max-w-md w-full">
            <img src="/assets/zuppi-logo-dark.png" alt="Zuppi" className="h-12 w-auto" />

            <div className="text-center lg:text-left">
              <h1 className="text-3xl xl:text-4xl font-black text-gray-900 leading-tight">
                O futuro das vendas{" "}
                <span className="text-orange-500">B2B</span> é{" "}
                <span className="text-orange-500">coletivo.</span>
              </h1>
              <p className="mt-3 text-gray-500 text-base">
                Compre junto. <span className="font-semibold text-orange-500">Pague menos.</span> Todo mundo ganha.
              </p>
            </div>

            {/* Hero cart — official brand image */}
            <div className="w-full flex justify-center lg:justify-start">
              <img
                src="/assets/zuppi-hero.png"
                alt="Zuppi compras coletivas"
                className="w-64 lg:w-80 xl:w-88 object-contain"
              />
            </div>

            <div className="hidden lg:flex flex-col gap-3 w-full">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={15} className="text-orange-500" />
                  </div>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="flex flex-col justify-center items-center px-6 py-10 lg:w-[46%] bg-white">
          <div className="w-full max-w-sm space-y-6">

            <div>
              <h2 className="text-2xl font-black text-gray-900">Bem-vindo de volta</h2>
              <p className="text-sm text-gray-500 mt-1">Entre na sua conta para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-base">E-mail</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com.br" className="input-base w-full" autoComplete="email" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="label-base mb-0">Senha</label>
                  <button type="button" className="text-xs text-orange-500 hover:underline">Esqueci a senha</button>
                </div>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••" className="input-base w-full pr-10" autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-base py-3.5 rounded-xl transition-all shadow-md shadow-orange-100">
                {loading ? "Entrando…" : <><span>Entrar</span><ArrowRight size={17} /></>}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 whitespace-nowrap">acesso rápido</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="space-y-2">
              {[
                { label: "Comprador demo", sub: "joao@bompreco.com", em: "joao@bompreco.com", pw: "123456", path: "/comprador", dot: "bg-blue-400", hover: "hover:border-blue-200 hover:bg-blue-50/40" },
                { label: "Fornecedor demo", sub: "ana@moinhobrasil.com", em: "ana@moinhobrasil.com", pw: "123456", path: "/fornecedor", dot: "bg-green-400", hover: "hover:border-green-200 hover:bg-green-50/40" },
                { label: "Gestão Zuppi", sub: "gestor@zuppi.com.br", em: "gestor@zuppi.com.br", pw: "", path: "/gestao", dot: "bg-orange-400", hover: "hover:border-orange-200 hover:bg-orange-50/40" },
              ].map(({ label, sub, em, pw, path, dot, hover }) => (
                <button key={label} onClick={() => quickLogin(em, pw, path)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-200 ${hover} transition-all text-left group`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{label}</p>
                      <p className="text-[11px] text-gray-400">{sub}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-gray-500">
              Não tem conta?{" "}
              <Link to="/auth" className="text-orange-500 font-bold hover:text-orange-600">Criar grátis</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
