import type { Offer, ProgressiveTier, Reservation, ReservationStatus } from "../types";

export function getReservedValue(offer: Offer) {
  return offer.reservedAmount || offer.reservedQty * offer.zuppiPrice;
}

export function getTargetValue(offer: Offer) {
  return offer.targetType === "amount" ? offer.targetAmount || offer.minGoal : offer.targetQuantity || offer.minGoal;
}

export function getProgressCurrent(offer: Offer) {
  return offer.targetType === "amount" ? getReservedValue(offer) : offer.reservedQty;
}

export function statusFromOffer(offer: Offer): ReservationStatus {
  if (offer.status === "meta_atingida") return "meta_atingida";
  if (offer.status === "pedido_gerado" || offer.status === "pedido_confirmado") return "confirmado";
  if (offer.status === "finalizada" || offer.status === "em_entrega") return "entregue";
  if (offer.status === "cancelada") return "cancelado";
  return "aguardando_meta";
}

export function updateOfferStatus(offer: Offer): Offer {
  const current = getProgressCurrent(offer);
  const target = getTargetValue(offer);
  const reached = current >= target;
  if (reached && (offer.status === "ativa" || offer.status === "aberta")) {
    return { ...offer, status: "meta_atingida", approved: true };
  }
  return offer;
}

export function recalcReservationStatuses(offers: Offer[], reservations: Reservation[]): Reservation[] {
  return reservations.map((reservation) => {
    // Don't overwrite market orders or manually-set terminal statuses
    if (reservation.purchaseMode === "market") return reservation;
    if (["venda_concluida", "cliente_nao_cumpriu", "cancelado"].includes(reservation.status)) return reservation;
    const offer = offers.find((item) => item.id === reservation.offerId);
    if (!offer) return reservation;
    return { ...reservation, status: statusFromOffer(offer) };
  });
}

export function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function parseDecimal(value: FormDataEntryValue | string | number | null) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function dateLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR");
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function maxOfferDeadlineInputValue() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

export function isDeadlineWithinThreeDays(dateString: string) {
  const selected = new Date(`${dateString}T23:59:59`);
  const now = new Date();
  const max = new Date();
  max.setDate(max.getDate() + 90);
  max.setHours(23, 59, 59, 999);
  return selected >= now && selected <= max;
}

export function percent(current: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

export function offerProgress(offer: Offer) {
  const current = getProgressCurrent(offer);
  const target = getTargetValue(offer);
  return {
    current,
    target,
    missing: Math.max(0, target - current),
    percent: percent(current, target),
  };
}

export function formatGoal(offer: Offer, value: number) {
  return offer.targetType === "amount" ? currency(value) : `${value.toLocaleString("pt-BR")} ${offer.unit}`;
}

export function offerAvailability(offer: Offer) {
  const max = offer.maxQty || offer.targetQuantity || offer.minGoal;
  const available = Math.max(0, max - offer.reservedQty);
  return {
    max,
    available,
    reserved: offer.reservedQty,
    availablePercent: percent(available, max),
    reservedPercent: percent(offer.reservedQty, max),
  };
}

// ─── Progressive tiers ─────────────────────────────────────────────────────

export function getCurrentCollectivePrice(offer: Offer): number {
  const tiers = offer.progressiveTiers;
  if (!tiers || tiers.length === 0) return offer.zuppiPrice;
  const pct = offerProgress(offer).percent;
  const sorted = [...tiers].sort((a, b) => b.percentage - a.percentage);
  const active = sorted.find((t) => pct >= t.percentage);
  return active ? active.price : offer.zuppiPrice;
}

export function getBestCollectivePrice(offer: Offer): number {
  const tiers = offer.progressiveTiers;
  if (!tiers || tiers.length === 0) return offer.zuppiPrice;
  return Math.min(...tiers.map((t) => t.price));
}

export function getNextTier(offer: Offer): ProgressiveTier | null {
  const tiers = offer.progressiveTiers;
  if (!tiers || tiers.length === 0) return null;
  const pct = offerProgress(offer).percent;
  const sorted = [...tiers].sort((a, b) => a.percentage - b.percentage);
  return sorted.find((t) => t.percentage > pct) || null;
}

export function getMarketPrice(offer: Offer): number {
  return offer.marketPrice ?? offer.normalPrice;
}

export function calculateSupplierCommission(concludedAmount: number, commissionRate: number): number {
  return concludedAmount * commissionRate;
}

// ─── Month utilities ────────────────────────────────────────────────────────

export function monthKey(dateIso: string) {
  return dateIso.slice(0, 7);
}

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return `${MONTH_NAMES_PT[month - 1]} de ${year}`;
}

export function lastMonthOptions(count = 12) {
  const now = new Date();
  const options: { key: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ key, label: monthLabel(key) });
  }
  return options;
}
