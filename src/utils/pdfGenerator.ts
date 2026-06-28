import jsPDF from "jspdf";
import type { Offer, Reservation, MarketOrder, BuyerProfile, SupplierProfile } from "../types";

interface PedidoData {
  offer: Offer;
  reservations?: Reservation[];
  marketOrders?: MarketOrder[];
  buyers: BuyerProfile[];
  supplier: SupplierProfile;
  type: "coletiva" | "imediata";
}

export function generatePedidoPDF(data: PedidoData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Cores
  const primaryColor = [249, 115, 22]; // #F97316
  const textColor = [51, 65, 85]; // Cinza escuro

  // Cabeçalho
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ZUP", 20, 20);
  doc.setFontSize(14);
  doc.text("PEDIDO DE COMPRA", pageWidth - 60, 20);

  // Número do pedido
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(10);
  const pedidoId = `PED-${Date.now()}`;
  doc.text(`${pedidoId}`, 20, 40);

  yPosition = 50;

  // Seção: PRODUTO
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("📦 PRODUTO", 20, yPosition);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  yPosition += 8;
  doc.text(`Nome: ${data.offer.product}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Categoria: ${data.offer.category}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Marca: ${data.offer.brand}`, 25, yPosition);
  yPosition += 5;
  doc.text(`Unidade: ${data.offer.unit}`, 25, yPosition);
  yPosition += 5;

  // Seção: RESUMO DE COMPRA
  yPosition += 5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("📊 RESUMO DE COMPRA", 20, yPosition);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "normal");
  yPosition += 8;

  if (data.type === "coletiva" && data.reservations) {
    const totalQty = data.reservations.reduce((sum, r) => sum + r.quantity, 0);
    const totalAmount = data.reservations.reduce((sum, r) => sum + r.totalAmount, 0);

    doc.text(`Total de Reservas: ${totalQty} ${data.offer.unit}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Valor Total: R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Número de Compradores: ${data.reservations.length}`, 25, yPosition);
  } else if (data.type === "imediata" && data.marketOrders) {
    const totalQty = data.marketOrders.reduce((sum, m) => sum + m.quantity, 0);
    const totalAmount = data.marketOrders.reduce((sum, m) => sum + m.totalAmount, 0);

    doc.text(`Total Vendido: ${totalQty} ${data.offer.unit}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Valor Total: R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, yPosition);
  }

  yPosition += 8;

  // Seção: COMPRADORES
  if (data.type === "coletiva" && data.reservations && data.reservations.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("👥 COMPRADORES", 20, yPosition);
    yPosition += 8;

    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    data.reservations.forEach((reservation, index) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      const buyer = data.buyers.find(b => b.id === reservation.buyerId);
      if (!buyer) return;

      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${buyer.companyName}`, 25, yPosition);
      yPosition += 4;

      doc.setFont("helvetica", "normal");
      doc.text(`Contato: ${buyer.whatsapp}`, 30, yPosition);
      yPosition += 4;
      doc.text(`Email: ${buyer.email}`, 30, yPosition);
      yPosition += 4;
      if (buyer.cnpj) {
        doc.text(`CNPJ: ${buyer.cnpj}`, 30, yPosition);
        yPosition += 4;
      }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Quantidade: ${reservation.quantity} ${reservation.unit} | R$ ${reservation.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 30, yPosition);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      yPosition += 6;
    });
  } else if (data.type === "imediata" && data.marketOrders) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("👥 COMPRADOR", 20, yPosition);
    yPosition += 8;

    data.marketOrders.forEach((order) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      const buyer = data.buyers.find(b => b.id === order.buyerId);
      if (!buyer) return;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(9);
      doc.text(`Nome: ${buyer.companyName}`, 25, yPosition);
      yPosition += 4;
      doc.text(`Contato: ${buyer.whatsapp}`, 25, yPosition);
      yPosition += 4;
      doc.text(`Email: ${buyer.email}`, 25, yPosition);
      yPosition += 4;
      if (buyer.cnpj) {
        doc.text(`CNPJ: ${buyer.cnpj}`, 25, yPosition);
        yPosition += 4;
      }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`Quantidade: ${order.quantity} ${order.unit} | R$ ${order.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, yPosition);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      yPosition += 6;
    });
  }

  yPosition += 5;

  // Seção: PRAZOS
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(10);
  doc.text("📅 PRAZOS E CONDIÇÕES", 20, yPosition);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  yPosition += 8;
  doc.text(`Prazo de Entrega: ${data.offer.deliveryTime}`, 25, yPosition);
  yPosition += 4;
  doc.text(`Deadline da Oferta: ${data.offer.deadline}`, 25, yPosition);
  yPosition += 4;
  doc.text(`Termos de Pagamento: ${data.offer.paymentTerms}`, 25, yPosition);
  yPosition += 4;
  doc.text(`Região: ${data.offer.region}`, 25, yPosition);
  yPosition += 4;
  if (data.offer.notes) {
    doc.text(`Observações: ${data.offer.notes}`, 25, yPosition);
  }

  // Rodapé
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const currentDate = new Date().toLocaleDateString("pt-BR");
  const currentTime = new Date().toLocaleTimeString("pt-BR");
  doc.text(`Gerado em: ${currentDate} às ${currentTime}`, 20, pageHeight - 10);

  return doc;
}

export function downloadPDF(doc: jsPDF, fileName: string) {
  doc.save(`${fileName}-${Date.now()}.pdf`);
}
