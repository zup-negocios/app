import { Link, useLocation } from "react-router-dom";
import { useAppState } from "./AppProvider";

export function MobileNav() {
  const { session } = useAppState();
  const { pathname } = useLocation();

  if (!session) return null;

  const items =
    session.role === "buyer"
      ? [
          ["/comprador", "Inicio"],
          ["/ofertas", "Ofertas"],
          ["/avaliacoes", "Notas"],
        ]
      : [
          ["/fornecedor", "Painel"],
          ["/fornecedor/criar-oferta", "Nova oferta"],
          ["/avaliacoes", "Notas"],
        ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
      <div className="grid grid-cols-3">
        {items.map(([to, label]) => (
          <Link
            key={to}
            to={to}
            className={`text-center py-3 text-sm font-medium ${pathname === to ? "text-orange-600" : "text-gray-500"}`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
