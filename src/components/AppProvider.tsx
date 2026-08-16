import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { BuyerProfile, BuyerType, Category, City, MarketOrder, MarketOrderStatus, Offer, Rating, RatingTarget, Reservation, ReservationStatus, SessionUser, SupplierProfile } from "../types";
import { bootstrapStorage, store } from "../utils/storage";
import { getCurrentCollectivePrice, getReservedValue, isEditDeadlineValid, parseDecimal, recalcReservationStatuses, updateOfferStatus } from "../utils/business";
import { sendCollectiveOrderMessage, sendMetaAchievedMessage, sendImmediateOrderMessage } from "../utils/whatsappService";
import { onBuyerSignup, onSupplierSignup, onClientImmediatePurchase, onClientCollectiveReservation } from "../utils/autoMessages";
import { isSupabaseEnabled, pushRows, fetchTable } from "../lib/supabase";

function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  local.forEach((item) => map.set(item.id, item));
  remote.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
}

interface AppState {
  buyers: BuyerProfile[];
  suppliers: SupplierProfile[];
  offers: Offer[];
  reservations: Reservation[];
  marketOrders: MarketOrder[];
  ratings: Rating[];
  categories: Category[];
  cities: City[];
  session: SessionUser | null;
  login: (role: "buyer" | "supplier", email: string, password: string) => { ok: boolean; message?: string };
  loginAs: (id: string, role: "buyer" | "supplier") => void;
  logout: () => void;
  addBuyer: (data: Omit<BuyerProfile, "id" | "role">) => BuyerProfile;
  addSupplier: (data: Omit<SupplierProfile, "id" | "role" | "approved" | "planoFornecedor"> & { planoFornecedor?: SupplierProfile["planoFornecedor"] }) => SupplierProfile;
  addOffer: (data: Omit<Offer, "id" | "reservedQty" | "reservedAmount" | "status" | "approved" | "editStatus" | "createdAt">) => void;
  updateOffer: (id: string, data: Partial<Offer>) => { ok: boolean; message?: string };
  updateOfferImage: (id: string, imageBase64: string | undefined) => void;
  requestOfferEdit: (id: string) => void;
  reserve: (offerId: string, buyerId: string, quantity: number) => { ok: boolean; message?: string };
  createMarketOrder: (offerId: string, buyerId: string, quantity: number, buyerType?: BuyerType) => { ok: boolean; message?: string; orderId?: string };
  updateMarketOrderStatus: (orderId: string, status: MarketOrderStatus) => void;
  updateReservationStatus: (reservationId: string, status: ReservationStatus) => void;
  updateBuyerScore: (buyerId: string, fulfilled: boolean) => void;
  updateSupplierApproval: (id: string, approved: boolean) => void;
  updateOfferApproval: (id: string, approved: boolean) => void;
  updateSupplierPlan: (id: string, planoFornecedor: SupplierProfile["planoFornecedor"]) => void;
  updateSupplier: (id: string, data: Partial<SupplierProfile>) => void;
  addCategory: (name: string) => void;
  toggleCategory: (id: string) => void;
  addCity: (name: string, state: string) => void;
  toggleCity: (id: string) => void;
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
  const [marketOrders, setMarketOrders] = useState(store.getMarketOrders());
  const [ratings, setRatings] = useState(store.getRatings());
  const [categories, setCategories] = useState(store.getCategories());
  const [cities, setCities] = useState(store.getCities());
  const [session, setSession] = useState(store.getSession());

  // Sincronizar dados do localStorage em tempo real (quando mudanças vêm de outras abas/janelas)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedBuyers = store.getBuyers();
      const storedSuppliers = store.getSuppliers();
      const storedOffers = store.getOffers();
      const storedReservations = store.getReservations();
      const storedMarketOrders = store.getMarketOrders();
      const storedRatings = store.getRatings();

      if (JSON.stringify(storedBuyers) !== JSON.stringify(buyers)) setBuyers(storedBuyers);
      if (JSON.stringify(storedSuppliers) !== JSON.stringify(suppliers)) setSuppliers(storedSuppliers);
      if (JSON.stringify(storedOffers) !== JSON.stringify(offers)) setOffers(storedOffers);
      if (JSON.stringify(storedReservations) !== JSON.stringify(reservations)) setReservations(storedReservations);
      if (JSON.stringify(storedMarketOrders) !== JSON.stringify(marketOrders)) setMarketOrders(storedMarketOrders);
      if (JSON.stringify(storedRatings) !== JSON.stringify(ratings)) setRatings(storedRatings);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [buyers, suppliers, offers, reservations, marketOrders, ratings]);

  // Refs para acessar o estado mais recente dentro do polling (evita closures desatualizadas)
  const offersRef = useRef(offers);
  const reservationsRef = useRef(reservations);
  useEffect(() => { offersRef.current = offers; }, [offers]);
  useEffect(() => { reservationsRef.current = reservations; }, [reservations]);

  // Puxar dados do Supabase ao abrir + a cada poucos segundos (sincronizacao entre dispositivos)
  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    let cancelled = false;

    const pullFromSupabase = async () => {
      const [remoteBuyers, remoteSuppliers, remoteOffers, remoteReservations, remoteMarketOrders] = await Promise.all([
        fetchTable<BuyerProfile>("buyers"),
        fetchTable<SupplierProfile>("suppliers"),
        fetchTable<Offer>("offers"),
        fetchTable<Reservation>("reservations"),
        fetchTable<MarketOrder>("market_orders"),
      ]);
      if (cancelled) return;

      setBuyers((prev) => {
        const merged = mergeById(prev, remoteBuyers);
        store.setBuyers(merged);
        return merged;
      });
      setSuppliers((prev) => {
        const merged = mergeById(prev, remoteSuppliers);
        store.setSuppliers(merged);
        return merged;
      });
      setMarketOrders((prev) => {
        const merged = mergeById(prev, remoteMarketOrders);
        store.setMarketOrders(merged);
        return merged;
      });

      const mergedOffers = mergeById(offersRef.current, remoteOffers).map(updateOfferStatus);
      const mergedReservations = mergeById(reservationsRef.current, remoteReservations);
      const recalced = recalcReservationStatuses(mergedOffers, mergedReservations);
      setOffers(mergedOffers);
      setReservations(recalced);
      store.setOffers(mergedOffers);
      store.setReservations(recalced);
    };

    pullFromSupabase();
    const timer = setInterval(pullFromSupabase, 8000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const syncOffers = (nextOffers: Offer[], sourceReservations = reservations) => {
    const normalized = nextOffers.map(updateOfferStatus);
    const nextReservations = recalcReservationStatuses(normalized, sourceReservations);
    setOffers(normalized);
    setReservations(nextReservations);
    store.setOffers(normalized);
    store.setReservations(nextReservations);
    pushRows("offers", normalized);
    pushRows("reservations", nextReservations);
  };

  const value = useMemo<AppState>(
    () => ({
      buyers,
      suppliers,
      offers,
      reservations,
      marketOrders,
      ratings,
      categories,
      cities,
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
        pushRows("buyers", [next]);
        // Enviar mensagem de boas-vindas
        onBuyerSignup(next);
        return next;
      },
      addSupplier: (data) => {
        const next = { ...data, id: uid("supplier"), role: "supplier" as const, approved: true, planoFornecedor: data.planoFornecedor || "gratuito" };
        const all = [...suppliers, next];
        setSuppliers(all);
        store.setSuppliers(all);
        pushRows("suppliers", [next]);
        // Enviar mensagem com dados de acesso
        onSupplierSignup(next, data.password);
        return next;
      },
      addOffer: (data) => {
        const next: Offer = {
          ...data,
          // Meta de oferta é sempre por quantidade, independente do que o chamador envie.
          targetType: "quantity",
          targetAmount: undefined,
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
        const current = offers.find((offer) => offer.id === id);
        if (!current) return { ok: false, message: "Oferta nao encontrada." };

        // Trava de data: a nova data limite não pode ultrapassar lançamento + 3 dias.
        // Validado aqui (não só no formulário) para que nenhum caller consiga contornar a regra.
        if (data.deadline && !isEditDeadlineValid(current.createdAt, data.deadline)) {
          return { ok: false, message: "A data limite não pode ultrapassar 3 dias após o lançamento da oferta." };
        }

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
      updateOfferImage: (id, imageBase64) => {
        syncOffers(offers.map((offer) => (offer.id === id ? { ...offer, imageBase64 } : offer)));
      },
      reserve: (offerId, buyerId, quantity) => {
        const offer = offers.find((item) => item.id === offerId);
        const buyer = buyers.find((item) => item.id === buyerId);
        const supplier = offer ? suppliers.find((item) => item.id === offer.supplierId) : undefined;
        if (!offer || !buyer || !supplier) return { ok: false, message: "Nao foi possivel localizar a oferta." };
        const minQty = offer.collectiveMinimumQuantity || offer.minimumPurchasePerBuyer;
        if (quantity < minQty) {
          return { ok: false, message: `A quantidade minima para participar desta oferta e de ${minQty} ${offer.unit}.` };
        }
        const unitPrice = getCurrentCollectivePrice(offer);
        const totalAmount = parseDecimal(quantity * unitPrice);
        const allReservations: Reservation[] = [
          ...reservations,
          {
            id: uid("preorder"),
            offerId,
            supplierId: offer.supplierId,
            buyerId,
            buyerType: buyer.buyerType,
            purchaseMode: "collective",
            quantity,
            unit: offer.unit,
            unitPrice,
            totalAmount,
            product: offer.product,
            brand: offer.brand,
            category: offer.category,
            buyerSnapshot: { companyName: buyer.companyName, cnpj: buyer.cnpj, contactName: buyer.contactName, whatsapp: buyer.whatsapp, email: buyer.email, city: buyer.city, segment: buyer.segment },
            supplierSnapshot: { companyName: supplier.companyName, cnpj: supplier.cnpj, contactName: supplier.contactName, whatsapp: supplier.whatsapp, email: supplier.email, city: supplier.city },
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

        // Enviar mensagem automática ao cliente
        const newReservation = allReservations[allReservations.length - 1];
        onClientCollectiveReservation(buyer, offer, newReservation);

        // Enviar notificação WhatsApp ao fornecedor
        const newReservedQty = offer.reservedQty + quantity;
        sendCollectiveOrderMessage(offer, newReservedQty, supplier);

        // Verificar se meta foi atingida
        const targetQty = offer.targetQuantity || 0;
        if (newReservedQty >= targetQty && offer.reservedQty < targetQty) {
          // Meta acabou de ser atingida
          const totalAmount = allReservations
            .filter(r => r.offerId === offerId)
            .reduce((sum, r) => sum + r.totalAmount, 0);
          sendMetaAchievedMessage(
            offer,
            newReservedQty,
            totalAmount,
            allReservations.filter(r => r.offerId === offerId).length,
            supplier
          );
        }

        return { ok: true, message: "Sua intenção de compra foi registrada! Quando a oferta encerrar, você sera avisado sobre o preço final e a ordem gerada." };
      },
      createMarketOrder: (offerId, buyerId, quantity, buyerType) => {
        const offer = offers.find((item) => item.id === offerId);
        const buyer = buyers.find((item) => item.id === buyerId);
        const supplier = offer ? suppliers.find((item) => item.id === offer.supplierId) : undefined;
        if (!offer || !buyer || !supplier) return { ok: false, message: "Nao foi possivel localizar a oferta." };
        if (!offer.marketSaleEnabled) return { ok: false, message: "Esta oferta nao possui compra imediata ativada." };
        const minQty = offer.marketMinimumQuantity || 1;
        if (quantity < minQty) {
          return { ok: false, message: `A quantidade minima para compra no Market e de ${minQty} ${offer.unit}.` };
        }
        const unitPrice = offer.marketPrice || offer.normalPrice;
        const totalAmount = parseDecimal(quantity * unitPrice);
        const orderId = uid("market");
        const newOrder: MarketOrder = {
          id: orderId,
          offerId,
          supplierId: offer.supplierId,
          buyerId,
          buyerType: buyerType || buyer.buyerType,
          purchaseMode: "market",
          quantity,
          unitPrice,
          totalAmount,
          product: offer.product,
          unit: offer.unit,
          buyerSnapshot: { companyName: buyer.companyName, cnpj: buyer.cnpj, contactName: buyer.contactName, whatsapp: buyer.whatsapp, email: buyer.email, city: buyer.city, segment: buyer.segment },
          supplierSnapshot: { companyName: supplier.companyName, cnpj: supplier.cnpj, contactName: supplier.contactName, whatsapp: supplier.whatsapp, email: supplier.email, city: supplier.city },
          status: "ordem_gerada",
          createdAt: new Date().toISOString(),
        };
        const all = [...marketOrders, newOrder];
        setMarketOrders(all);
        store.setMarketOrders(all);
        pushRows("market_orders", [newOrder]);

        // Enviar mensagem automática ao cliente
        onClientImmediatePurchase(buyer, offer, newOrder);

        // Enviar notificação WhatsApp ao fornecedor (venda imediata)
        sendImmediateOrderMessage(offer, quantity, totalAmount, buyer.companyName, supplier);

        return { ok: true, message: "Ordem de compra gerada! O fornecedor foi notificado e dara sequencia a negociacao.", orderId };
      },
      updateMarketOrderStatus: (orderId, status) => {
        const all = marketOrders.map((o) => (o.id === orderId ? { ...o, status } : o));
        setMarketOrders(all);
        store.setMarketOrders(all);
        pushRows("market_orders", all);
      },
      updateReservationStatus: (reservationId, status) => {
        const all = reservations.map((r) => (r.id === reservationId ? { ...r, status } : r));
        setReservations(all);
        store.setReservations(all);
        pushRows("reservations", all);
      },
      updateBuyerScore: (buyerId, fulfilled) => {
        const all = buyers.map((b) => {
          if (b.id !== buyerId) return b;
          const brokenIntentions = fulfilled ? b.brokenIntentions ?? 0 : (b.brokenIntentions ?? 0) + 1;
          const fulfilledPurchases = fulfilled ? (b.fulfilledPurchases ?? 0) + 1 : b.fulfilledPurchases ?? 0;
          const rating = fulfilled ? b.rating ?? 100 : Math.max(0, (b.rating ?? 100) - 10);
          return { ...b, rating, fulfilledPurchases, brokenIntentions };
        });
        setBuyers(all);
        store.setBuyers(all);
        pushRows("buyers", all);
      },
      updateSupplierApproval: (id, approved) => {
        const all = suppliers.map((supplier) => (supplier.id === id ? { ...supplier, approved } : supplier));
        setSuppliers(all);
        store.setSuppliers(all);
        pushRows("suppliers", all);
      },
      updateOfferApproval: (id, approved) => {
        const all: Offer[] = offers.map((offer) => (offer.id === id ? { ...offer, approved, status: approved ? "ativa" : "aguardando_aprovacao" } : offer));
        syncOffers(all);
      },
      updateSupplierPlan: (id, planoFornecedor) => {
        const all = suppliers.map((supplier) => (supplier.id === id ? { ...supplier, planoFornecedor } : supplier));
        setSuppliers(all);
        store.setSuppliers(all);
        pushRows("suppliers", all);
      },
      updateSupplier: (id, data) => {
        const all = suppliers.map((supplier) => (supplier.id === id ? { ...supplier, ...data } : supplier));
        setSuppliers(all);
        store.setSuppliers(all);
        pushRows("suppliers", all);
      },
      addCategory: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const all = [
          ...categories,
          { id: trimmed.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-"), name: trimmed, icon: "Circle", active: true, order: categories.length + 1, subcategories: [] },
        ];
        setCategories(all);
        store.setCategories(all);
      },
      toggleCategory: (id) => {
        const all = categories.map((category) => (category.id === id ? { ...category, active: !category.active } : category));
        setCategories(all);
        store.setCategories(all);
      },
      addCity: (name, state) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const all: City[] = [
          ...cities,
          { id: trimmed.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-"), name: trimmed, state: state.trim().toUpperCase(), active: true, order: cities.length + 1 },
        ];
        setCities(all);
        store.setCities(all);
      },
      toggleCity: (id) => {
        const all = cities.map((city) => (city.id === id ? { ...city, active: !city.active } : city));
        setCities(all);
        store.setCities(all);
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
    [buyers, suppliers, offers, reservations, marketOrders, ratings, categories, cities, session],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppProvider");
  return ctx;
}
