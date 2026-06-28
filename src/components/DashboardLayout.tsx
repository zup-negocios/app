import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Search, Building2, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAppState } from "./AppProvider";

type Role = "buyer" | "supplier" | "admin";

interface Props {
  role: Role;
  children: React.ReactNode;
}

function DashboardHeader({ role }: { role: Role }) {
  const navigate = useNavigate();
  const { session, logout, buyers, suppliers } = useAppState();
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentUser = session
    ? role === "buyer"
      ? buyers.find(b => b.id === session.id)
      : suppliers.find(s => s.id === session.id)
    : null;

  const companyName = currentUser?.companyName || "Usuário";
  const roleLabel = role === "buyer" ? "Comprador" : role === "supplier" ? "Fornecedor" : "Admin";

  return (
    <header className="h-[60px] bg-white border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-10 shadow-[0_1px_0_0_#f3f4f6]">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar ofertas, produtos ou compradores..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50/50"
            onKeyDown={e => { if (e.key === "Enter" && query.trim()) navigate(`/ofertas?q=${query}`); }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button className="relative w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
          <Bell size={16} className="text-gray-500" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">3</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <Building2 size={14} className="text-orange-600" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-gray-800 leading-tight max-w-[120px] truncate">{companyName}</p>
              <p className="text-[10px] text-gray-500">{roleLabel}</p>
            </div>
            <ChevronDown size={13} className="text-gray-400" />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <Link
                  to={role === "buyer" ? "/comprador" : "/fornecedor"}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setDropdownOpen(false)}
                >
                  <LayoutDashboard size={14} className="text-gray-400" /> Meu painel
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={14} /> Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function DashboardLayout({ role, children }: Props) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader role={role} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
