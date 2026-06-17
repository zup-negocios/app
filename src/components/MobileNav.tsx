import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Tag, ShoppingCart, User, MoreHorizontal,
  Package, BarChart2, X, PlusCircle, Sliders, Settings,
  LogOut, HelpCircle, Crown,
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
        className="flex flex-col items-center gap-0.5 flex-1 py-2 min-w-0"
      >
        <Icon size={22} className={active ? "text-orange-500" : "text-gray-400"} />
        <span className={`text-[10px] font-medium truncate ${active ? "text-orange-500" : "text-gray-400"}`}>{label}</span>
      </Link>
    );
  };

  const MoreBtn = () => (
    <button
      onClick={() => setShowMore(!showMore)}
      className="flex flex-col items-center gap-0.5 flex-1 py-2"
    >
      <MoreHorizontal size={22} className={showMore ? "text-orange-500" : "text-gray-400"} />
      <span className={`text-[10px] font-medium ${showMore ? "text-orange-500" : "text-gray-400"}`}>Mais</span>
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
        <div className="fixed inset-0 z-40 flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowMore(false)} />
          <div className="relative bg-white rounded-t-2xl pb-28 z-50">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-700">Menu</span>
              <button onClick={() => setShowMore(false)} className="p-1">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-2">
              {session.role === "buyer" ? (
                <>
                  <DrawerLink to="/ofertas" icon={Tag} label="Ofertas abertas" />
                  <DrawerLink to="/configuracoes" icon={Settings} label="Configurações" />
                  <DrawerLink to="/tutorial" icon={HelpCircle} label="Suporte / Tutorial" />
                </>
              ) : (
                <>
                  <DrawerLink to="/fornecedor/criar-oferta" icon={PlusCircle} label="Criar oferta" />
                  <DrawerLink to="/fornecedor/simulador" icon={Sliders} label="Simulador" />
                  <DrawerLink to="/configuracoes" icon={Crown} label="Meu plano" />
                  <DrawerLink to="/configuracoes" icon={Settings} label="Configurações" />
                  <DrawerLink to="/tutorial" icon={HelpCircle} label="Suporte" />
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

      {/* Botão flutuante criar oferta (fornecedor) */}
      {session.role === "supplier" && !showMore && (
        <Link
          to="/fornecedor/criar-oferta"
          className="fixed bottom-20 right-4 z-30 md:hidden w-12 h-12 rounded-full bg-orange-500 shadow-lg flex items-center justify-center"
        >
          <PlusCircle size={22} className="text-white" />
        </Link>
      )}

      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-1px_8px_rgba(0,0,0,0.06)] z-30 safe-area-bottom">
        <div className="flex items-stretch">
          {session.role === "buyer" ? (
            <>
              <NavItem to="/comprador" icon={LayoutDashboard} label="Início" exact />
              <NavItem to="/ofertas" icon={Tag} label="Ofertas" />
              <NavItem to="/comprador/minhas-compras" icon={ShoppingCart} label="Compras" />
              <NavItem to="/dados-cadastrais" icon={User} label="Perfil" />
              <MoreBtn />
            </>
          ) : (
            <>
              <NavItem to="/fornecedor" icon={LayoutDashboard} label="Início" exact />
              <NavItem to="/fornecedor/ofertas" icon={Package} label="Ofertas" />
              <NavItem to="/fornecedor/pre-pedidos" icon={ShoppingCart} label="Ordens" />
              <NavItem to="/fornecedor/relatorio-compras" icon={BarChart2} label="Relatórios" />
              <MoreBtn />
            </>
          )}
        </div>
      </nav>
    </>
  );
}
