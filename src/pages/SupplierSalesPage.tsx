import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import { Download, Filter, TrendingUp, ShoppingCart, FileText } from "lucide-react";
import { generatePedidoPDF, downloadPDF } from "../utils/pdfGenerator";
import toast from "react-hot-toast";

type SalesType = "todos" | "coletiva" | "imediata";
type SalesStatus = "todos" | "ativa" | "concluida";

export function SupplierSalesPage() {
  const { session, suppliers, offers, reservations, marketOrders, buyers } = useAppState();
  const [filterType, setFilterType] = useState<SalesType>("todos");
  const [filterStatus, setFilterStatus] = useState<SalesStatus>("todos");

  if (!session || session.role !== "supplier") return <Navigate to="/" replace />;

  const supplier = suppliers.find(s => s.id === session.id);
  if (!supplier) return <Navigate to="/" replace />;

  // Ofertas do fornecedor
  const supplierOffers = offers.filter(o => o.supplierId === supplier.id);

  // Vendas coletivas
  const collectiveSales = useMemo(() => {
    return supplierOffers.flatMap(offer => {
      const offerReservations = reservations.filter(r => r.offerId === offer.id);
      if (offerReservations.length === 0) return [];

      const totalQty = offerReservations.reduce((sum, r) => sum + r.quantity, 0);
      const totalAmount = offerReservations.reduce((sum, r) => sum + r.totalAmount, 0);
      const metaProgress = (totalQty / offer.targetQuantity) * 100;
      const status = offer.status === "ativa" ? "ativa" : "concluida";

      return [{
        id: `coletiva-${offer.id}`,
        type: "coletiva" as const,
        offerId: offer.id,
        offer,
        reservations: offerReservations,
        totalQty,
        totalAmount,
        metaProgress,
        status,
        buyerCount: offerReservations.length,
        createdAt: offer.createdAt,
      }];
    });
  }, [supplierOffers, reservations]);

  // Vendas imediatas
  const immediateSales = useMemo(() => {
    return supplierOffers.flatMap(offer => {
      const offerOrders = marketOrders.filter(m => m.offerId === offer.id);
      if (offerOrders.length === 0) return [];

      return offerOrders.map(order => ({
        id: `imediata-${order.id}`,
        type: "imediata" as const,
        offerId: offer.id,
        offer,
        order,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        status: order.status,
        buyerName: buyers.find(b => b.id === order.buyerId)?.companyName || "Desconhecido",
        createdAt: order.createdAt,
      }));
    });
  }, [supplierOffers, marketOrders, buyers]);

  // Filtrar vendas
  const allSales = [...collectiveSales, ...immediateSales];
  const filteredSales = allSales.filter(sale => {
    const typeMatch = filterType === "todos" || sale.type === filterType;
    const statusMatch = filterStatus === "todos" || sale.status === filterStatus;
    return typeMatch && statusMatch;
  });

  // Gerar PDF
  const handleGeneratePDF = (sale: (typeof filteredSales)[0]) => {
    try {
      if (sale.type === "coletiva") {
        const doc = generatePedidoPDF({
          offer: sale.offer,
          reservations: sale.reservations,
          buyers,
          supplier,
          type: "coletiva",
        });
        downloadPDF(doc, `pedido-coletivo-${sale.offer.product}`);
        toast.success("PDF gerado com sucesso!");
      } else {
        const doc = generatePedidoPDF({
          offer: sale.offer,
          marketOrders: [sale.order],
          buyers,
          supplier,
          type: "imediata",
        });
        downloadPDF(doc, `pedido-imediato-${sale.offer.product}`);
        toast.success("PDF gerado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <DashboardLayout role="supplier">
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Minhas Vendas</h1>
          <p className="text-gray-600 mt-2">Acompanhe todas as suas vendas coletivas e imediatas</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingCart size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSales.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {filteredSales.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Filter size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Ofertas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{supplierOffers.filter(o => o.status === "ativa").length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Venda</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as SalesType)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="todos">Todas</option>
                <option value="coletiva">Coletivas</option>
                <option value="imediata">Imediatas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as SalesStatus)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="todos">Todos</option>
                <option value="ativa">Ativas</option>
                <option value="concluida">Concluídas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Vendas */}
        <div className="space-y-4">
          {filteredSales.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <ShoppingCart size={32} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma venda encontrada</p>
            </div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-orange-200 transition-all">
                {sale.type === "coletiva" ? (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-1 rounded-full">COLETIVA</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${sale.status === "ativa" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                            {sale.status === "ativa" ? "ATIVA" : "CONCLUÍDA"}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{sale.offer.product}</h3>
                        <p className="text-sm text-gray-600 mt-1">{sale.offer.brand}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">R$ {sale.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        <p className="text-sm text-gray-600">{sale.buyerCount} comprador(es)</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progresso da Meta</span>
                        <span className="text-sm font-bold text-orange-600">{Math.round(sale.metaProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(sale.metaProgress, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {sale.totalQty.toLocaleString("pt-BR")} / {sale.offer.targetQuantity?.toLocaleString("pt-BR")} {sale.offer.unit}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGeneratePDF(sale)}
                        className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition-colors"
                      >
                        <Download size={16} />
                        Gerar PDF
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">IMEDIATA</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${sale.status === "ordem_gerada" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                            {sale.status === "ordem_gerada" ? "NOVA" : "CONCLUÍDA"}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{sale.offer.product}</h3>
                        <p className="text-sm text-gray-600 mt-1">{sale.buyerName}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">R$ {sale.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        <p className="text-sm text-gray-600">{sale.quantity} {sale.offer.unit}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGeneratePDF(sale)}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-colors"
                      >
                        <Download size={16} />
                        Gerar PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
