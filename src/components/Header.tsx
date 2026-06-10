import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Building2, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useAppState } from "./AppProvider";
import { useState } from "react";

function ZuppiLogoInline() {
  return (
    <Link to="/" className="hover:opacity-90 transition-opacity">
      <img src="/assets/zuppi-logo-dark.svg" alt="Zuppi" className="h-8 w-auto" />
    </Link>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session, logout, buyers, suppliers } = useAppState();
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dashboardPath = session?.role === "buyer" ? "/comprador" : "/fornecedor";
  const isInsideDashboard = pathname.startsWith("/comprador") || pathname.startsWith("/fornecedor") || pathname.startsWith("/admin");

  const currentUser = session
    ? session.role === "buyer"
      ? buyers.find(b => b.id === session.id)
      : suppliers.find(s => s.id === session.id)
    : null;
  const companyName = currentUser?.companyName || "";
  const roleLabel = session?.role === "buyer" ? "Comprador" : session?.role === "supplier" ? "Fornecedor" : "Admin";

  // Inside dashboard, header is embedded in the layout — hide top-level header
  if (isInsideDashboard) return null;

  return (
    <header className="border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <ZuppiLogoInline />

        <div className="flex-1 max-w-xl hidden md:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar ofertas, produtos ou compradores..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50"
              onKeyDown={e => { if (e.key === "Enter" && query.trim()) { navigate(`/ofertas?q=${query}`); } }}
            />
          </div>
        </div>

        <nav className="hidden md:flex gap-1 items-center ml-auto">
          <Link className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === "/" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`} to="/">Início</Link>
          <Link className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith("/ofertas") ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`} to="/ofertas">Ofertas</Link>

          {!session && (
            <Link className="btn-primary ml-2 text-sm py-2" to="/login">Entrar</Link>
          )}
          {session && (
            <div className="relative ml-2">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Building2 size={14} className="text-orange-600" />
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{companyName}</p>
                  <p className="text-[10px] text-gray-500">{roleLabel}</p>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <Link
                    to={dashboardPath}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LayoutDashboard size={14} className="text-gray-400" /> Meu painel
                  </Link>
                  <button
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={14} /> Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="md:hidden ml-auto">
          {!session
            ? <Link className="btn-primary text-sm py-2" to="/login">Entrar</Link>
            : <button className="btn-secondary text-sm py-2" onClick={logout}>Sair</button>
          }
        </div>
      </div>
    </header>
  );
}
