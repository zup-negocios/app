import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, Users, Zap,
  Package, BarChart2, X, PlusCircle, Sliders, Settings,
  LogOut, HelpCircle, Plus, MoreHorizontal,
} from "lucide-react";
import { useAppState } from "./AppProvider";

export function MobileNav() {
  const { session, logout } = useAppState();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  if (!session) return null;

  const isActive = (to: string, exact = false) =>
    exact ? pathname === to : pathname.startsWith(to);

  const NavItem = ({ to, icon: Icon, label, exact }: { to: string; icon: React.ElementType; label: string; exact?: boolean }) => {
    const active = isActive(to, exact);
    return (
      <Link
        to={to}
        onClick={() => setShowMore(false)}
        className="flex flex-col items-center justify-center gap-1 flex-1 py-2 min-w-0"
      >
        <Icon size={24} className={active ? "text-orange-500" : "text-gray-400"} />
        <span className={`text-[10px] font-semibold truncate ${active ? "text-orange-500" : "text-gray-400"}`}>{label}</span>
      </Link>
    );
  };

  const MoreBtn = () => (
    <button
      onClick={() => setShowMore(!showMore)}
      className="flex flex-col items-center justify-center gap-1 flex-1 py-2"
    >
      <MoreHorizontal size={24} className={showMore ? "text-orange-500" : "text-gray-400"} />
      <span className={`text-[10px] font-semibold ${showMore ? "text-orange-500" : "text-gray-400"}`}>Mais</span>
    </button>
  );

  const DrawerLink = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <Link
      to={to}
      onClick={() => setShowMore(false)}
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
    >
      <Icon size={18} className="text-gray-500 flex-shrink-0" />
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );

  return (
    <>
      {/* Drawer "Mais" */}
      {showMore && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMore(false)} />
          <div className="relative bg-white rounded-t-2xl z-50" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-700">Menu</span>
              <button onClick={() => setShowMore(false)} className="p-1">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-2">
              {session.role === "buyer" ? (
                <>
                  <DrawerLink to="/comprador/relatorio" icon={BarChart2} label="Relatórios" />
                  <DrawerLink to="/configuracoes" icon={Settings} label="Configurações" />
                  <a
                    href="https://wa.me/5500000000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <HelpCircle size={18} className="text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">Suporte</span>
                  </a>
                </>
              ) : (
                <>
                  <DrawerLink to="/fornecedor/criar-oferta" icon={PlusCircle} label="Criar oferta" />
                  <DrawerLink to="/fornecedor/simulador" icon={Sliders} label="Simulador" />
                  <DrawerLink to="/configuracoes" icon={Settings} label="Configurações" />
                </>
              )}
              <button
                onClick={() => { logout(); navigate("/"); setShowMore(false); }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut size={18} className="text-red-400 flex-shrink-0" />
                <span className="text-sm font-medium text-red-500">Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante "+" para supplier */}
      {session.role === "supplier" && !showMore && (
        <Link
          to="/fornecedor/criar-oferta"
          className="fixed z-40 md:hidden w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg flex items-center justify-center"
          style={{ bottom: "96px", right: "16px" }}
        >
          <Plus size={24} />
        </Link>
      )}

      {/* Bottom nav bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch" style={{ height: "80px" }}>
          {session.role === "buyer" ? (
            <>
              <NavItem to="/comprador" icon={LayoutDashboard} label="Início" exact />
              <NavItem to="/comprador/comprar-individualmente" icon={Zap} label="Comprar" />
              <NavItem to="/comprador/compra-coletiva" icon={Users} label="Coletiva" />
              <NavItem to="/comprador/minhas-compras" icon={ShoppingCart} label="Compras" />
              <MoreBtn />
            </>
          ) : (
            <>
              <NavItem to="/fornecedor" icon={LayoutDashboard} label="Início" exact />
              <NavItem to="/fornecedor/ofertas" icon={Package} label="Ofertas" />
              <NavItem to="/fornecedor/pedidos" icon={ShoppingCart} label="Pedidos" />
              <NavItem to="/fornecedor/relatorio-compras" icon={BarChart2} label="Relatórios" />
              <MoreBtn />
            </>
          )}
        </div>
      </nav>
    </>
  );
}
