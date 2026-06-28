import { buyerSeeds, categorySeeds, marketOrderSeeds, offerSeeds, ratingSeeds, reservationSeeds, supplierSeeds } from "../data/seeds";
import type { BuyerProfile, Category, MarketOrder, Offer, Rating, Reservation, SessionUser, SupplierProfile } from "../types";

const KEYS = {
  seedVersion: "zuppi_seed_version",
  buyers: "zuppi_buyers",
  suppliers: "zuppi_suppliers",
  offers: "zuppi_offers",
  reservations: "zuppi_reservations",
  marketOrders: "zuppi_market_orders",
  ratings: "zuppi_ratings",
  categories: "zuppi_categories",
  session: "zuppi_session",
};

const CURRENT_SEED_VERSION = "2026-06-19-v1";

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function migrateAuthData() {
  const buyers = read<BuyerProfile[]>(KEYS.buyers, buyerSeeds).map((buyer) => ({
    ...buyer,
    password: buyer.password || "123456",
    rating: buyer.rating ?? 100,
    fulfilledPurchases: buyer.fulfilledPurchases ?? 0,
    brokenIntentions: buyer.brokenIntentions ?? 0,
  }));
  const suppliers = read<SupplierProfile[]>(KEYS.suppliers, supplierSeeds).map((supplier) => ({
    ...supplier,
    password: supplier.password || "123456",
    planoFornecedor: supplier.planoFornecedor || "gratuito",
    commissionRate: supplier.commissionRate ?? 0.03,
  }));
  write(KEYS.buyers, buyers);
  write(KEYS.suppliers, suppliers);
}

export function bootstrapStorage() {
  const shouldRefreshSeeds = localStorage.getItem(KEYS.seedVersion) !== CURRENT_SEED_VERSION;

  if (!localStorage.getItem(KEYS.buyers) || shouldRefreshSeeds) write(KEYS.buyers, buyerSeeds);
  if (!localStorage.getItem(KEYS.suppliers) || shouldRefreshSeeds) write(KEYS.suppliers, supplierSeeds);
  if (!localStorage.getItem(KEYS.offers) || shouldRefreshSeeds) write(KEYS.offers, offerSeeds);
  if (!localStorage.getItem(KEYS.reservations) || shouldRefreshSeeds) write(KEYS.reservations, reservationSeeds);
  if (!localStorage.getItem(KEYS.marketOrders) || shouldRefreshSeeds) write(KEYS.marketOrders, marketOrderSeeds);
  if (!localStorage.getItem(KEYS.ratings) || shouldRefreshSeeds) write(KEYS.ratings, ratingSeeds);
  if (!localStorage.getItem(KEYS.categories) || shouldRefreshSeeds) write(KEYS.categories, categorySeeds);
  migrateAuthData();
  localStorage.setItem(KEYS.seedVersion, CURRENT_SEED_VERSION);
}

export const store = {
  getBuyers: () => read<BuyerProfile[]>(KEYS.buyers, buyerSeeds),
  setBuyers: (buyers: BuyerProfile[]) => write(KEYS.buyers, buyers),

  getSuppliers: () => read<SupplierProfile[]>(KEYS.suppliers, supplierSeeds),
  setSuppliers: (suppliers: SupplierProfile[]) => write(KEYS.suppliers, suppliers),

  getOffers: () => read<Offer[]>(KEYS.offers, offerSeeds),
  setOffers: (offers: Offer[]) => write(KEYS.offers, offers),

  getReservations: () => read<Reservation[]>(KEYS.reservations, reservationSeeds),
  setReservations: (reservations: Reservation[]) => write(KEYS.reservations, reservations),

  getMarketOrders: () => read<MarketOrder[]>(KEYS.marketOrders, marketOrderSeeds),
  setMarketOrders: (orders: MarketOrder[]) => write(KEYS.marketOrders, orders),

  getRatings: () => read<Rating[]>(KEYS.ratings, ratingSeeds),
  setRatings: (ratings: Rating[]) => write(KEYS.ratings, ratings),

  getCategories: () => read<Category[]>(KEYS.categories, categorySeeds),
  setCategories: (categories: Category[]) => write(KEYS.categories, categories),

  getSession: () => read<SessionUser | null>(KEYS.session, null),
  setSession: (session: SessionUser | null) => {
    if (session) write(KEYS.session, session);
    else localStorage.removeItem(KEYS.session);
  },
};
