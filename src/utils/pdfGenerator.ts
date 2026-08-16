import jsPDF from "jspdf";
import type { Offer, Reservation, MarketOrder, BuyerProfile, SupplierProfile } from "../types";
import { currency } from "./business";

interface PedidoData {
  offer: Offer;
  reservations?: Reservation[];
  marketOrders?: MarketOrder[];
  buyers: BuyerProfile[];
  supplier: SupplierProfile;
  type: "coletiva" | "imediata";
}

const PRIMARY: [number, number, number] = [249, 115, 22]; // #F97316
const TEXT: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [130, 140, 155];
const MARGIN = 20;

// Número do pedido estável: derivado do id da oferta (coletiva) ou do id da
// ordem (imediata), não de Date.now() — gerar o PDF de novo para o mesmo
// pedido sempre retorna o mesmo número, e pedidos diferentes nunca colidem.
function buildPedidoId(data: PedidoData): string {
  const source = data.type === "coletiva" ? data.offer.id : data.marketOrders?.[0]?.id || data.offer.id;
  const clean = source.replace(/^(offer|market|preorder)-/, "").replace(/[^a-zA-Z0-9]/g, "");
  return `PED-${clean.toUpperCase()}`;
}

function formatAddress(buyer: BuyerProfile): string {
  const hasAddress = buyer.street || buyer.streetNumber || buyer.neighborhood || buyer.zipCode;
  if (!hasAddress) return "Endereço não informado";
  const line1 = [buyer.street, buyer.streetNumber].filter(Boolean).join(", ");
  const line2 = [buyer.complement, buyer.neighborhood].filter(Boolean).join(" — ");
  const line3 = [buyer.city, buyer.zipCode ? `CEP ${buyer.zipCode}` : ""].filter(Boolean).join(" · ");
  return [line1, line2, line3].filter(Boolean).join("\n");
}

export function generatePedidoPDF(data: PedidoData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = 20;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionHeading = (title: string) => {
    checkPageBreak(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY);
    doc.text(title, MARGIN, y);
    y += 2;
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, pageWidth - MARGIN, y);
    y += 6;
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
  };

  const field = (label: string, value: string, indent = MARGIN) => {
    checkPageBreak(5);
    doc.setFont("helvetica", "bold");
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.text(`${label}:`, indent, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value || "Não informado", contentWidth - labelWidth - (indent - MARGIN));
    doc.text(lines, indent + labelWidth + 1, y);
    y += 4.5 * lines.length;
  };

  // ─── CABEÇALHO ──────────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ZUP", MARGIN, 19);
  doc.setFontSize(13);
  doc.text("PEDIDO DE COMPRA", pageWidth - MARGIN, 15, { align: "right" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const now = new Date();
  doc.text(`Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR")}`, pageWidth - MARGIN, 22, { align: "right" });

  y = 40;
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(buildPedidoId(data), MARGIN, y);
  y += 10;

  // ─── FORNECEDOR ─────────────────────────────────────────────────────────
  sectionHeading("DADOS DO FORNECEDOR");
  field("Razão social", data.supplier.companyName);
  field("CNPJ", data.supplier.cnpj);
  field("Inscrição estadual", "Não informado");
  field("Contato", `${data.supplier.contactName} — ${data.supplier.whatsapp}`);
  field("E-mail", data.supplier.email);
  field("Cidade", data.supplier.city);
  y += 4;

  // ─── PRODUTO ────────────────────────────────────────────────────────────
  sectionHeading("PRODUTO");
  field("Nome", data.offer.product);
  field("Categoria", data.offer.category);
  field("Marca", data.offer.brand);
  field("Unidade", data.offer.unit);
  y += 4;

  // ─── ITENS DO PEDIDO (tabela) ───────────────────────────────────────────
  sectionHeading("ITENS DO PEDIDO");

  type Row = { buyerName: string; quantity: number; unitPrice: number; total: number };
  const rows: Row[] = [];

  if (data.type === "coletiva" && data.reservations) {
    for (const reservation of data.reservations) {
      const buyer = data.buyers.find(b => b.id === reservation.buyerId);
      rows.push({
        buyerName: buyer?.companyName || "Comprador",
        quantity: reservation.quantity,
        unitPrice: reservation.unitPrice,
        total: reservation.totalAmount,
      });
    }
  } else if (data.type === "imediata" && data.marketOrders) {
    for (const order of data.marketOrders) {
      const buyer = data.buyers.find(b => b.id === order.buyerId);
      rows.push({
        buyerName: buyer?.companyName || "Comprador",
        quantity: order.quantity,
        unitPrice: order.unitPrice,
        total: order.totalAmount,
      });
    }
  }

  const colX = { buyer: MARGIN, qty: MARGIN + 80, unit: MARGIN + 110, total: MARGIN + 150 };
  checkPageBreak(10);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(245, 246, 248);
  doc.rect(MARGIN, y - 4, contentWidth, 7, "F");
  doc.text("Comprador", colX.buyer + 1, y);
  doc.text(`Qtd. (${data.offer.unit})`, colX.qty, y);
  doc.text("Preço unit.", colX.unit, y);
  doc.text("Subtotal", colX.total, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  let totalQty = 0;
  let totalAmount = 0;
  rows.forEach((row, index) => {
    checkPageBreak(6);
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 251);
      doc.rect(MARGIN, y - 4, contentWidth, 6, "F");
    }
    doc.text(doc.splitTextToSize(row.buyerName, 75), colX.buyer + 1, y);
    doc.text(String(row.quantity), colX.qty, y);
    doc.text(currency(row.unitPrice), colX.unit, y);
    doc.text(currency(row.total), colX.total, y);
    y += 6;
    totalQty += row.quantity;
    totalAmount += row.total;
  });

  checkPageBreak(7);
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, y - 3, pageWidth - MARGIN, y - 3);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", colX.buyer + 1, y);
  doc.text(String(totalQty), colX.qty, y);
  doc.text(currency(totalAmount), colX.total, y);
  y += 10;

  // ─── DADOS DOS COMPRADORES ──────────────────────────────────────────────
  sectionHeading(data.type === "coletiva" ? "DADOS DOS COMPRADORES" : "DADOS DO COMPRADOR");

  rows.forEach((row, index) => {
    const source = data.type === "coletiva" ? data.reservations?.[index] : data.marketOrders?.[index];
    const buyer = data.buyers.find(b => b.id === source?.buyerId);
    if (!buyer) return;

    checkPageBreak(38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...PRIMARY);
    doc.text(`${index + 1}. ${buyer.companyName}`, MARGIN, y);
    doc.setTextColor(...TEXT);
    doc.setFontSize(9);
    y += 5;

    field("CNPJ", buyer.cnpj || "Não informado", MARGIN + 4);
    field("Inscrição estadual", "Não informado", MARGIN + 4);
    field("Contato", buyer.whatsapp, MARGIN + 4);
    field("E-mail", buyer.email, MARGIN + 4);
    field("Endereço de entrega", formatAddress(buyer), MARGIN + 4);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    field("Quantidade / Valor", `${row.quantity} ${data.offer.unit} — ${currency(row.unitPrice)}/${data.offer.unit} = ${currency(row.total)}`, MARGIN + 4);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "normal");
    y += 3;
  });

  // ─── RESUMO FINANCEIRO ──────────────────────────────────────────────────
  sectionHeading("RESUMO FINANCEIRO");
  field(data.type === "coletiva" ? "Total de reservas" : "Total vendido", `${totalQty} ${data.offer.unit}`);
  field("Número de compradores", String(rows.length));
  field("Valor total do pedido", currency(totalAmount));
  field("Condição de pagamento", data.offer.paymentTerms || "Não informado");
  y += 4;

  // ─── PRAZOS E CONDIÇÕES ─────────────────────────────────────────────────
  sectionHeading("PRAZOS E CONDIÇÕES");
  field("Prazo de entrega", data.offer.deliveryTime || "Não informado");
  field("Deadline da oferta", data.offer.deadline);
  field("Termos de pagamento", data.offer.paymentTerms || "Não informado");
  field("Região", data.offer.region);
  if (data.offer.notes) field("Observações", data.offer.notes);

  // ─── RODAPÉ ─────────────────────────────────────────────────────────────
  const pageCount = doc.internal.pages.length - 1;
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`${buildPedidoId(data)} · Gerado em ${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR")} · Sistema ZUP`, MARGIN, pageHeight - 10);
    doc.text(`Página ${page}/${pageCount}`, pageWidth - MARGIN, pageHeight - 10, { align: "right" });
  }

  return doc;
}

export function downloadPDF(doc: jsPDF, fileName: string) {
  doc.save(`${fileName}-${Date.now()}.pdf`);
}
