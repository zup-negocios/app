import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, BarChart2,
  Settings, PlusCircle, Sliders, Crown, Headphones,
  ChevronRight, Users, Zap, LogOut, Shield,
} from "lucide-react";
import { useAppState } from "./AppProvider";

type Role = "buyer" | "supplier" | "admin";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

const buyerNav: NavItem[] = [
  { to: "/comprador", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/comprador/comprar-individualmente", label: "Comprar individualmente", icon: Zap },
  { to: "/comprador/compra-coletiva", label: "Compra coletiva", icon: Users },
  { to: "/comprador/minhas-compras", label: "Minhas compras", icon: ShoppingCart },
  { to: "/comprador/relatorio", label: "Relatórios", icon: BarChart2 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

const supplierNav: NavItem[] = [
  { to: "/fornecedor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/fornecedor/ofertas", label: "Minhas ofertas", icon: Package },
  { to: "/fornecedor/criar-oferta", label: "Criar oferta", icon: PlusCircle },
  { to: "/fornecedor/pedidos", label: "Pedidos", icon: ShoppingCart },
  { to: "/fornecedor/simulador", label: "Simulador", icon: Sliders },
  { to: "/fornecedor/relatorio-compras", label: "Relatórios", icon: BarChart2 },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard Admin", icon: Shield, exact: true },
  { to: "/admin", label: "Fornecedores", icon: Users },
  { to: "/admin", label: "Categorias", icon: Package },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

function ZupLogo() {
  return (
    <Link to="/" className="flex items-center px-5 py-4 border-b border-gray-100 hover:opacity-90 transition-opacity">
      <img src="/assets/zup-logo-dark.png" alt="Zup" className="h-8 w-auto" />
    </Link>
  );
}

export function Sidebar({ role }: { role: Role }) {
  const { pathname } = useLocation();
  const { logout } = useAppState();
  const navigate = useNavigate();

  const navItems = role === "buyer" ? buyerNav : role === "supplier" ? supplierNav : adminNav;

  return (
    <aside className="hidden md:flex flex-col w-[220px] min-h-screen bg-white border-r border-gray-100 shadow-[1px_0_0_0_#f3f4f6] flex-shrink-0">
      <ZupLogo />

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact }, i) => {
          const active = exact
            ? pathname === to
            : pathname.startsWith(to) && to !== "/configuracoes" || pathname === to;
          return (
            <Link
              key={`${to}-${i}`}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative ${
                active
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
              style={active ? { borderLeft: "3px solid #F97316", paddingLeft: "9px" } : {}}
            >
              <Icon
                size={17}
                className={active ? "text-orange-500" : "text-gray-400 group-hover:text-gray-500"}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 space-y-3 mt-auto">
        {role === "supplier" && (
          <div className="rounded-xl p-3.5 bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] border border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <Crown size={15} className="text-amber-500" />
              <span className="text-sm font-bold text-gray-800">Plano Pro</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-2.5">
              Mais visibilidade,<br />mais negócios.
            </p>
            <Link
              to="/configuracoes"
              className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Ver benefícios <ChevronRight size={11} />
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Headphones size={13} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">Precisa de ajuda?</p>
            <p className="text-[10px] text-gray-400 truncate">Fale com nosso suporte</p>
          </div>
        </div>

        <button
          onClick={() => { logout(); navigate("/"); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={17} className="text-red-400" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
