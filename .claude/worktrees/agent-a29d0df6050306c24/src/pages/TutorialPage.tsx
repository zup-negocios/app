import { Navigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAppState } from "../components/AppProvider";

const buyerSteps = [
  "Entre em Ofertas abertas e filtre por categoria ou prazo.",
  "Abra uma oferta para ver compra minima, cronometro, meta e reputacao do fornecedor.",
  "Reserve uma quantidade valida para gerar um pedido.",
  "Acompanhe tudo em Ofertas participando e Meus pedidos.",
  "Depois da operacao, avalie o fornecedor para reduzir riscos futuros.",
];

const supplierSteps = [
  "Crie uma oferta com prazo maximo de 3 dias, compra minima e meta clara.",
  "Acompanhe disponibilidade, compradores e total reservado no painel.",
  "Abra a oferta para ver pedidos e gerar relatorio imprimivel.",
  "Use Relatorio de clientes e Relatorio de compras para medir demanda.",
  "Avalie compradores para sinalizar confiabilidade para novas ofertas.",
];

export function TutorialPage() {
  const { session } = useAppState();
  if (!session) return <Navigate to="/auth" replace />;
  const steps = session.role === "buyer" ? buyerSteps : supplierSteps;

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-[240px_1fr] gap-4">
      <Sidebar role={session.role} />
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Tutorial</h1>
          <p className="text-gray-600">{session.role === "buyer" ? "Fluxo recomendado para comprar com seguranca." : "Fluxo recomendado para vender por volume com previsibilidade."}</p>
        </div>
        <div className="grid gap-3">
          {steps.map((step, index) => (
            <article key={step} className="card p-4 flex gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">{index + 1}</div>
              <p className="text-gray-700">{step}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
