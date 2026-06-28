import jsPDF from "jspdf";

export interface PDFPreOrder {
  companyName: string;
  cnpj: string;
  responsibleName: string;
  whatsapp: string;
  email: string;
  city: string;
  segment: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface PDFReportData {
  offerName: string;
  productName: string;
  brand: string;
  category: string;
  supplierName: string;
  generatedAt: string;
  normalPrice: number;
  zuppiPrice: number;
  targetType: "quantity" | "amount";
  targetValue: number;
  reservedQuantity: number;
  reservedAmount: number;
  progressPercent: number;
  status: string;
  preOrders: PDFPreOrder[];
}

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export async function exportOfferReportPDF(data: PDFReportData): Promise<void> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const M = 15;
  let y = M;

  const orange: [number, number, number] = [249, 115, 22];
  const dark: [number, number, number] = [31, 41, 55];
  const gray: [number, number, number] = [107, 114, 128];
  const lightGray: [number, number, number] = [243, 244, 246];

  // Header
  pdf.setFillColor(...orange);
  pdf.rect(0, 0, W, 28, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  pdf.text("ZUPPI", M, 16);
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("O futuro das vendas B2B é coletivo.", M, 22);
  pdf.text(`Gerado em: ${data.generatedAt}`, W - M, 16, { align: "right" });
  y = 38;

  // Title
  pdf.setTextColor(...dark);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text(`Relatório: ${data.offerName}`, M, y);
  y += 8;

  pdf.setDrawColor(...orange);
  pdf.setLineWidth(0.5);
  pdf.line(M, y, W - M, y);
  y += 8;

  // Product info block
  pdf.setFillColor(...lightGray);
  pdf.rect(M, y, W - M * 2, 40, "F");
  const infoItems: [string, string][] = [
    ["Produto", data.productName],
    ["Marca", data.brand],
    ["Categoria", data.category],
    ["Fornecedor", data.supplierName],
    ["Preço normal", fmt(data.normalPrice)],
    ["Preço Zuppi", fmt(data.zuppiPrice)],
  ];
  const colW = (W - M * 2) / 3;
  infoItems.forEach(([label, value], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = M + 4 + col * colW;
    const iy = y + 10 + row * 16;
    pdf.setTextColor(...gray);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(label, x, iy);
    pdf.setTextColor(...dark);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, x, iy + 6);
  });
  y += 48;

  // Goal summary
  pdf.setTextColor(...dark);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Resumo da Meta", M, y);
  y += 7;

  const metaItems = [
    { label: "Meta definida", value: data.targetType === "quantity" ? `${data.targetValue.toLocaleString("pt-BR")} un.` : fmt(data.targetValue) },
    { label: "Total reservado", value: data.targetType === "quantity" ? `${data.reservedQuantity.toLocaleString("pt-BR")} un.` : fmt(data.reservedAmount) },
    { label: "Progresso", value: `${data.progressPercent.toFixed(1)}%` },
    { label: "Status", value: data.status },
  ];
  const mColW = (W - M * 2) / 4;
  metaItems.forEach((item, i) => {
    const x = M + i * mColW;
    pdf.setFillColor(240, 253, 244);
    pdf.rect(x, y, mColW - 3, 20, "F");
    pdf.setTextColor(...gray);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text(item.label, x + 3, y + 7);
    pdf.setTextColor(...dark);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(item.value, x + 3, y + 15);
  });
  y += 28;

  // Progress bar
  const barW = W - M * 2;
  pdf.setFillColor(...lightGray);
  pdf.rect(M, y, barW, 5, "F");
  const fill = Math.min(data.progressPercent / 100, 1) * barW;
  pdf.setFillColor(...(data.progressPercent >= 100 ? ([16, 185, 129] as [number,number,number]) : orange));
  pdf.rect(M, y, fill, 5, "F");
  y += 12;

  // Pre-orders table
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(...dark);
  pdf.text(`Compradores Interessados (${data.preOrders.length})`, M, y);
  y += 7;

  const cols = ["Empresa", "Cidade", "Qtd", "Valor Total", "Status", "Data"];
  const colWidths = [55, 28, 20, 32, 28, 22];
  pdf.setFillColor(...orange);
  pdf.rect(M, y, W - M * 2, 8, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  let cx = M + 2;
  cols.forEach((col, i) => {
    pdf.text(col, cx, y + 5.5);
    cx += colWidths[i];
  });
  y += 8;

  data.preOrders.forEach((po, idx) => {
    if (y > 270) { pdf.addPage(); y = M; }
    if (idx % 2 === 0) {
      pdf.setFillColor(...lightGray);
      pdf.rect(M, y, W - M * 2, 8, "F");
    }
    pdf.setTextColor(...dark);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    const row = [
      po.companyName.substring(0, 30),
      po.city.substring(0, 14),
      `${po.quantity} ${po.unit}`,
      fmt(po.totalAmount),
      po.status,
      po.createdAt.split("T")[0],
    ];
    cx = M + 2;
    row.forEach((cell, i) => {
      pdf.text(cell, cx, y + 5.5);
      cx += colWidths[i];
    });
    y += 8;
  });

  // Totals
  y += 6;
  pdf.setDrawColor(...orange);
  pdf.line(M, y, W - M, y);
  y += 6;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...dark);
  const totalQty = data.preOrders.reduce((a, p) => a + p.quantity, 0);
  const totalVal = data.preOrders.reduce((a, p) => a + p.totalAmount, 0);
  pdf.text(`Compradores: ${data.preOrders.length}`, M, y);
  pdf.text(`Qtd total: ${totalQty.toLocaleString("pt-BR")}`, M + 60, y);
  pdf.text(`Valor total: ${fmt(totalVal)}`, M + 130, y);

  // Footer on all pages
  const pageCount = (pdf.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setTextColor(...gray);
    pdf.text("Zuppi — O futuro das vendas B2B é coletivo.", M, 292);
    pdf.text(`Página ${i} de ${pageCount}`, W - M, 292, { align: "right" });
  }

  const fileName = `zuppi-relatorio-${data.offerName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(fileName);
}

export function exportCSV(preOrders: PDFPreOrder[], offerName: string): void {
  const headers = ["Empresa", "CNPJ", "Responsável", "WhatsApp", "Email", "Cidade", "Segmento", "Qtd", "Unidade", "Preço Unit.", "Valor Total", "Status", "Data"];
  const rows = preOrders.map(p => [
    p.companyName, p.cnpj, p.responsibleName, p.whatsapp, p.email,
    p.city, p.segment, p.quantity, p.unit,
    p.unitPrice.toFixed(2), p.totalAmount.toFixed(2), p.status, p.createdAt.split("T")[0],
  ]);
  const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zuppi-compradores-${offerName.toLowerCase().replace(/\s+/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
