import { ArrowRight, Boxes, Building2, ChartNoAxesCombined, Handshake } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function LoginChoice() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-4">
      <div className="text-center space-y-3">
        <img src="/assets/zup-logo-light.png" alt="Zup logo" className="h-16 w-auto mx-auto" />
        <h1 className="text-3xl md:text-4xl font-extrabold">Escolha seu acesso</h1>
        <p className="text-gray-600">Dois fluxos diferentes para dois trabalhos diferentes dentro da compra coletiva B2B.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="border border-orange-200 bg-orange-50 rounded-2xl p-6 space-y-4">
          <div className="h-12 w-12 rounded-xl bg-orange-500 text-white flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-orange-700 uppercase">Comprador B2B</p>
            <h2 className="text-2xl font-bold">Encontrar ofertas e reservar quantidades</h2>
          </div>
          <div className="grid gap-2 text-sm text-gray-700">
            <p className="flex gap-2"><Handshake size={18} className="text-orange-600 shrink-0" /> Ver ofertas ativas de fornecedores aprovados</p>
            <p className="flex gap-2"><ChartNoAxesCombined size={18} className="text-orange-600 shrink-0" /> Acompanhar meta, economia e prazo</p>
            <p className="flex gap-2"><Boxes size={18} className="text-orange-600 shrink-0" /> Gerar pedidos em Meus pedidos</p>
          </div>
          <button className="btn-primary w-full flex items-center justify-center gap-2 py-3" onClick={() => navigate("?type=buyer")}>
            Acessar como comprador <ArrowRight size={18} />
          </button>
        </section>

        <section className="border border-gray-200 bg-white rounded-2xl p-6 space-y-4">
          <div className="h-12 w-12 rounded-xl bg-gray-900 text-white flex items-center justify-center">
            <Boxes size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 uppercase">Fornecedor</p>
            <h2 className="text-2xl font-bold">Publicar ofertas e acompanhar demanda</h2>
          </div>
          <div className="grid gap-2 text-sm text-gray-700">
            <p className="flex gap-2"><Boxes size={18} className="text-gray-900 shrink-0" /> Criar ofertas com meta e compra minima</p>
            <p className="flex gap-2"><ChartNoAxesCombined size={18} className="text-gray-900 shrink-0" /> Ver pedidos, progresso e compradores</p>
            <p className="flex gap-2"><Handshake size={18} className="text-gray-900 shrink-0" /> Gerar relatorio de compradores interessados</p>
          </div>
          <button className="btn-secondary w-full flex items-center justify-center gap-2 py-3" onClick={() => navigate("?type=supplier")}>
            Acessar como fornecedor <ArrowRight size={18} />
          </button>
        </section>
      </div>

      <p className="text-center text-xs text-gray-400">
        Equipe Zup?{" "}
        <Link to="/login" className="text-orange-500 font-semibold hover:underline">
          Acesso interno →
        </Link>
      </p>
    </div>
  );
}
