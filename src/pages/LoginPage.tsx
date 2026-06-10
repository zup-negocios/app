import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAppState } from "../components/AppProvider";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/assets/zuppi-logo-dark.svg" alt="Zuppi" className="h-12 w-auto mx-auto" />
          <p className="text-gray-500 text-sm mt-2">O futuro das vendas B2B é coletivo.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-5">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Bem-vindo de volta</h2>
            <p className="text-sm text-gray-400 mt-1">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <button type="button" className="text-xs text-orange-500 hover:underline">Esqueci a senha</button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-base py-3.5 rounded-xl transition-all"
            >
              {loading ? "Entrando…" : <><span>Entrar</span><ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">acesso rápido</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="space-y-2">
            {[
              { label: "Comprador demo", sub: "joao@bompreco.com", em: "joao@bompreco.com", pw: "123456", path: "/comprador", dot: "bg-blue-400" },
              { label: "Fornecedor demo", sub: "ana@moinhobrasil.com", em: "ana@moinhobrasil.com", pw: "123456", path: "/fornecedor", dot: "bg-green-400" },
              { label: "Gestão Zuppi", sub: "gestor@zuppi.com.br", em: "gestor@zuppi.com.br", pw: "", path: "/gestao", dot: "bg-orange-400" },
            ].map(({ label, sub, em, pw, path, dot }) => (
              <button key={label} onClick={() => quickLogin(em, pw, path)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/40 transition-all text-left group">
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

          <p className="text-center text-sm text-gray-500 pt-1">
            Não tem conta?{" "}
            <Link to="/auth" className="text-orange-500 font-bold hover:text-orange-600">Criar grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
