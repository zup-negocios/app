import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CardOferta } from "../components/CardOferta";
import { useAppState } from "../components/AppProvider";
import { percent } from "../utils/business";

type SortMode = "progresso" | "prazo" | "desconto";

export function OffersPage() {
  const { offers, categories } = useAppState();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(params.get("cat") || "todas");
  const [sortBy, setSortBy] = useState<SortMode>("progresso");

  const list = useMemo(() => {
    const filtered = offers.filter((offer) => {
      if (!offer.approved || !["ativa", "meta_atingida", "aberta"].includes(offer.status)) return false;
      if (category !== "todas" && offer.categoryId !== category) return false;
      const search = query.trim().toLowerCase();
      if (!search) return true;
      return (
        offer.product.toLowerCase().includes(search) ||
        offer.brand.toLowerCase().includes(search) ||
        offer.category.toLowerCase().includes(search)
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === "prazo") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sortBy === "desconto") {
        const disA = a.normalPrice - a.zuppiPrice;
        const disB = b.normalPrice - b.zuppiPrice;
        return disB - disA;
      }
      return percent(b.reservedQty, b.minGoal) - percent(a.reservedQty, a.minGoal);
    });
  }, [offers, query, category, sortBy]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <section className="card p-4">
        <h1 className="text-3xl font-bold">Ofertas abertas</h1>
        <p className="text-gray-600 mt-1">Encontre oportunidades por categoria, progresso e melhor desconto.</p>
        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="border rounded-xl px-3 py-2"
            placeholder="Buscar produto, marca ou categoria"
          />
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="border rounded-xl px-3 py-2">
            <option value="todas">todas</option>
            {categories.filter((item) => item.active).sort((a, b) => a.order - b.order).map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortMode)} className="border rounded-xl px-3 py-2">
            <option value="progresso">Ordenar por progresso</option>
            <option value="prazo">Ordenar por prazo</option>
            <option value="desconto">Ordenar por desconto</option>
          </select>
        </div>
      </section>

      {list.length === 0 && (
        <section className="card p-8 text-center">
          <h2 className="text-xl font-bold">Nenhuma oferta encontrada</h2>
          <p className="text-gray-600">Ajuste os filtros para ver mais resultados.</p>
        </section>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((offer) => <CardOferta key={offer.id} offer={offer} />)}
      </div>
    </main>
  );
}
