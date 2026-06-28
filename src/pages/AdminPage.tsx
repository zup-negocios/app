import { FormEvent } from "react";
import { Sidebar } from "../components/Sidebar";
import { useAppState } from "../components/AppProvider";
import { currency } from "../utils/business";

export function AdminPage() {
  const {
    buyers,
    suppliers,
    offers,
    reservations,
    categories,
    updateSupplierApproval,
    updateSupplierPlan,
    updateOfferApproval,
    addCategory,
    toggleCategory,
  } = useAppState();

  const handleCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    addCategory(String(data.get("category")));
    event.currentTarget.reset();
  };

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-[240px_1fr] gap-4">
      <Sidebar role="admin" />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Painel administrativo</h1>

        <section className="card p-4">
          <h2 className="font-bold mb-2">Categorias</h2>
          <form onSubmit={handleCategory} className="flex gap-2 mb-3">
            <input name="category" className="border rounded-lg p-2 flex-1" placeholder="Nova categoria" />
            <button className="btn-primary">Criar</button>
          </form>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categories.sort((a, b) => a.order - b.order).map((category) => (
              <button key={category.id} className="btn-secondary text-left" onClick={() => toggleCategory(category.id)}>
                {category.name} - {category.active ? "ativa" : "inativa"}
              </button>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-bold mb-2">Compradores cadastrados</h2>
          <div className="grid gap-2">{buyers.map((buyer) => <div key={buyer.id} className="text-sm">{buyer.companyName} - {buyer.segment} - {buyer.city}</div>)}</div>
        </section>

        <section className="card p-4">
          <h2 className="font-bold mb-2">Fornecedores cadastrados</h2>
          <div className="grid gap-2">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm border-b last:border-0 py-2">
                <span>{supplier.companyName} - {supplier.supplierType} - plano {supplier.planoFornecedor}</span>
                <div className="flex gap-2">
                  <button onClick={() => updateSupplierApproval(supplier.id, !supplier.approved)} className="btn-secondary">{supplier.approved ? "Reprovar" : "Aprovar"}</button>
                  <button onClick={() => updateSupplierPlan(supplier.id, supplier.planoFornecedor === "assinante" ? "gratuito" : "assinante")} className="btn-primary">
                    {supplier.planoFornecedor === "assinante" ? "Virar gratuito" : "Virar assinante"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-bold mb-2">Ofertas</h2>
          <div className="grid gap-2">
            {offers.map((offer) => (
              <div key={offer.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm border-b last:border-0 py-2">
                <span>{offer.product} - {offer.status} - {offer.reservedQty}/{offer.minGoal}</span>
                <button onClick={() => updateOfferApproval(offer.id, !offer.approved)} className="btn-secondary">{offer.approved ? "Reprovar" : "Aprovar"}</button>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-bold mb-2">Reservas e pedidos</h2>
          <div className="grid gap-2">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="text-sm border-b last:border-0 py-2">
                {reservation.product} - {reservation.buyerSnapshot.companyName} - {reservation.quantity} {reservation.unit} - {currency(reservation.totalAmount)} - {reservation.status}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
