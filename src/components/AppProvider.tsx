import { createContext, useContext, useMemo, useState } from "react";
import type { BuyerProfile, Category, Offer, Rating, RatingTarget, Reservation, SessionUser, SupplierProfile } from "../types";
import { bootstrapStorage, store } from "../utils/storage";
import { getReservedValue, parseDecimal, recalcReservationStatuses, updateOfferStatus } from "../utils/business";

interface AppState {
  buyers: BuyerProfile[];
  suppliers: SupplierProfile[];
  offers: Offer[];
  reservations: Reservation[];
  ratings: Rating[];
  categories: Category[];
  session: SessionUser | null;
  login: (role: "buyer" | "supplier", email: string, password: string) => { ok: boolean; message?: string };
  loginAs: (id: string, role: "buyer" | "supplier") => void;
  logout: () => void;
  addBuyer: (data: Omit<BuyerProfile, "id" | "role">) => BuyerProfile;
  addSupplier: (data: Omit<SupplierProfile, "id" | "role" | "approved" | "planoFornecedor"> & { planoFornecedor?: SupplierProfile["planoFornecedor"] }) => SupplierProfile;
  addOffer: (data: Omit<Offer, "id" | "reservedQty" | "reservedAmount" | "status" | "approved" | "editStatus" | "createdAt">) => void;
  updateOffer: (id: string, data: Partial<Offer>) => { ok: boolean; message?: string };
  requestOfferEdit: (id: string) => void;
  reserve: (offerId: string, buyerId: string, quantity: number) => { ok: boolean; message?: string };
  updateSupplierApproval: (id: string, approved: boolean) => void;
  updateOfferApproval: (id: string, approved: boolean) => void;
  updateSupplierPlan: (id: string, planoFornecedor: SupplierProfile["planoFornecedor"]) => void;
  updateSupplier: (id: string, data: Partial<SupplierProfile>) => void;
  addCategory: (name: string) => void;
  toggleCategory: (id: string) => void;
  addRating: (data: Omit<Rating, "id" | "createdAt">) => void;
  getRatingSummary: (targetId: string, targetType: RatingTarget) => { average: number; count: number };
}

const Ctx = createContext<AppState | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  bootstrapStorage();
  const [buyers, setBuyers] = useState(store.getBuyers());
  const [suppliers, setSuppliers] = useState(store.getSuppliers());
  const [offers, setOffers] = useState(store.getOffers());
  const [reservations, setReservations] = useState(store.getReservations());
  const [ratings, setRatings] = useState(store.getRatings());
  const [categories, setCategories] = useState(store.getCategories());
  const [session, setSession] = useState(store.getSession());

  const syncOffers = (nextOffers: Offer[], sourceReservations = reservations) => {
    const normalized = nextOffers.map(updateOfferStatus);
    const nextReservations = recalcReservationStatuses(normalized, sourceReservations);
    setOffers(normalized);
    setReservations(nextReservations);
    store.setOffers(normalized);
    store.setReservations(nextReservations);
  };

  const value = useMemo<AppState>(
    () => ({
      buyers,
      suppliers,
      offers,
      reservations,
      ratings,
      categories,
      session,
      login: (role, email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPassword = password.trim();
        if (role === "buyer") {
          const user = buyers.find((item) => item.email.trim().toLowerCase() === normalizedEmail && item.password === normalizedPassword);
          if (!user) return { ok: false, message: "E-mail ou senha invalidos." };
          const next = { id: user.id, role: "buyer" as const };
          setSession(next);
          store.setSession(next);
          return { ok: true };
        }
        const user = suppliers.find((item) => item.email.trim().toLowerCase() === normalizedEmail && item.password === normalizedPassword);
        if (!user) return { ok: false, message: "E-mail ou senha invalidos." };
        if (!user.approved) return { ok: false, message: "Fornecedor em analise. Aguarde aprovacao no painel admin." };
        const next = { id: user.id, role: "supplier" as const };
        setSession(next);
        store.setSession(next);
        return { ok: true };
      },
      loginAs: (id, role) => {
        const next = { id, role } as SessionUser;
        setSession(next);
        store.setSession(next);
      },
      logout: () => {
        setSession(null);
        store.setSession(null);
      },
      addBuyer: (data) => {
        const next = { ...data, id: uid("buyer"), role: "buyer" as const };
        const all = [...buyers, next];
        setBuyers(all);
        store.setBuyers(all);
        return next;
      },
      addSupplier: (data) => {
        const next = { ...data, id: uid("supplier"), role: "supplier" as const, approved: true, planoFornecedor: data.planoFornecedor || "gratuito" };
        const all = [...suppliers, next];
        setSuppliers(all);
        store.setSuppliers(all);
        return next;
      },
      addOffer: (data) => {
        const next: Offer = {
          ...data,
          id: uid("offer"),
          reservedQty: 0,
          reservedAmount: 0,
          status: "ativa",
          approved: true,
          editStatus: "edicao_livre",
          createdAt: new Date().toISOString(),
        };
        syncOffers([...offers, next]);
      },
      updateOffer: (id, data) => {
        const hasReservations = reservations.some((reservation) => reservation.offerId === id);
        if (hasReservations) {
          const nextOffers = offers.map((offer) => (offer.id === id ? { ...offer, editStatus: "edicao_solicitada" as const } : offer));
          syncOffers(nextOffers);
          return { ok: false, message: "Esta oferta ja possui compradores interessados. Para alterar, envie uma solicitacao de edicao para aprovacao." };
        }
        syncOffers(offers.map((offer) => (offer.id === id ? { ...offer, ...data } : offer)));
        return { ok: true };
      },
      requestOfferEdit: (id) => {
        syncOffers(offers.map((offer) => (offer.id === id ? { ...offer, editStatus: "edicao_solicitada" } : offer)));
      },
      reserve: (offerId, buyerId, quantity) => {
        const offer = offers.find((item) => item.id === offerId);
        const buyer = buyers.find((item) => item.id === buyerId);
        const supplier = offer ? suppliers.find((item) => item.id === offer.supplierId) : undefined;
        if (!offer || !buyer || !supplier) return { ok: false, message: "Nao foi possivel localizar a oferta." };
        if (quantity < offer.minimumPurchasePerBuyer) {
          return { ok: false, message: `A quantidade minima para participar desta oferta e de ${offer.minimumPurchasePerBuyer} ${offer.unit}.` };
        }

        const totalAmount = parseDecimal(quantity * offer.zuppiPrice);
        const allReservations: Reservation[] = [
          ...reservations,
          {
            id: uid("preorder"),
            offerId,
            supplierId: offer.supplierId,
            buyerId,
            quantity,
            unit: offer.unit,
            unitPrice: offer.zuppiPrice,
            totalAmount,
            product: offer.product,
            brand: offer.brand,
            category: offer.category,
            buyerSnapshot: buyer,
            supplierSnapshot: supplier,
            status: "aguardando_meta",
            createdAt: new Date().toISOString(),
          },
        ];
        const allOffers = offers.map((item) =>
          item.id === offerId
            ? updateOfferStatus({
                ...item,
                reservedQty: item.reservedQty + quantity,
                reservedAmount: getReservedValue(item) + totalAmount,
                editStatus: "edicao_bloqueada",
              })
            : item,
        );
        syncOffers(allOffers, allReservations);
        return { ok: true, message: "Sua reserva foi registrada com sucesso. Quando a meta for atingida, voce sera avisado para confirmar o pedido." };
      },
      updateSupplierApproval: (id, approved) => {
        const all = suppliers.map((supplier) => (supplier.id === id ? { ...supplier, approved } : supplier));
        setSuppliers(all);
        store.setSuppliers(all);
      },
      updateOfferApproval: (id, approved) => {
        const all: Offer[] = offers.map((offer) => (offer.id === id ? { ...offer, approved, status: approved ? "ativa" : "aguardando_aprovacao" } : offer));
        syncOffers(all);
      },
      updateSupplierPlan: (id, planoFornecedor) => {
        const all = suppliers.map((supplier) => (supplier.id === id ? { ...supplier, planoFornecedor } : supplier));
        setSuppliers(all);
        store.setSuppliers(all);
      },
      updateSupplier: (id, data) => {
        const all = suppliers.map((supplier) => (supplier.id === id ? { ...supplier, ...data } : supplier));
        setSuppliers(all);
        store.setSuppliers(all);
      },
      addCategory: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const all = [
          ...categories,
          { id: trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-"), name: trimmed, icon: "Circle", active: true, order: categories.length + 1, subcategories: [] },
        ];
        setCategories(all);
        store.setCategories(all);
      },
      toggleCategory: (id) => {
        const all = categories.map((category) => (category.id === id ? { ...category, active: !category.active } : category));
        setCategories(all);
        store.setCategories(all);
      },
      addRating: (data) => {
        const all: Rating[] = [
          ...ratings,
          {
            ...data,
            id: uid("rating"),
            score: Math.max(1, Math.min(5, data.score)),
            createdAt: new Date().toISOString(),
          },
        ];
        setRatings(all);
        store.setRatings(all);
      },
      getRatingSummary: (targetId, targetType) => {
        const scoped = ratings.filter((rating) => rating.targetId === targetId && rating.targetType === targetType);
        const average = scoped.length ? scoped.reduce((acc, rating) => acc + rating.score, 0) / scoped.length : 0;
        return { average, count: scoped.length };
      },
    }),
    [buyers, suppliers, offers, reservations, ratings, categories, session],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppProvider");
  return ctx;
}
