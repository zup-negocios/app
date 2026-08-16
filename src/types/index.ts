export type UserRole = "buyer" | "supplier";
export type SupplierPlan = "gratuito" | "assinante" | "founder" | "pro" | "free";
export type BuyerType = "b2b" | "b2c";
export type TargetType = "quantity" | "amount";
export type PurchaseMode = "market" | "collective";
export type EditStatus = "edicao_livre" | "edicao_bloqueada" | "edicao_solicitada" | "edicao_aprovada" | "edicao_recusada";

export interface ProgressiveTier {
  percentage: number;
  price: number;
}

export interface BuyerProfile {
  id: string;
  role: "buyer";
  buyerType?: BuyerType;
  // B2B
  companyName: string;
  cnpj?: string;
  segment?: string;
  // B2C
  cpf?: string;
  neighborhood?: string;
  // Common
  contactName: string;
  whatsapp: string;
  email: string;
  password: string;
  city: string;
  cityId?: string;
  // Scoring
  rating?: number;
  fulfilledPurchases?: number;
  brokenIntentions?: number;
}

export interface SupplierProfile {
  id: string;
  role: "supplier";
  companyName: string;
  cnpj: string;
  contactName: string;
  whatsapp: string;
  email: string;
  password: string;
  city: string;
  categories: string;
  supplierType: "fabricante" | "distribuidor" | "representante" | "atacadista";
  approved: boolean;
  planoFornecedor: SupplierPlan;
  planMonthlyFee?: number;
  commissionRate?: number;
  currentPlan?: "founder" | "pro" | "free";
}

export type UserProfile = BuyerProfile | SupplierProfile;

export type OfferStatus =
  | "rascunho"
  | "aguardando_aprovacao"
  | "ativa"
  | "pausada"
  | "meta_atingida"
  | "pedido_gerado"
  | "finalizada"
  | "cancelada"
  | "aberta"
  | "pedido_confirmado"
  | "em_entrega";

export interface Offer {
  id: string;
  supplierId: string;
  product: string;
  brand: string;
  category: string;
  categoryId?: string;
  subcategory?: string;
  description: string;
  unit: string;
  normalPrice: number;
  zuppiPrice: number;
  minGoal: number;
  minimumPurchasePerBuyer: number;
  targetType: TargetType;
  targetQuantity?: number;
  targetAmount?: number;
  maxQty?: number;
  reservedQty: number;
  reservedAmount: number;
  deadline: string;
  region: string;
  cityId?: string;
  paymentTerms: string;
  deliveryTime: string;
  notes: string;
  approved: boolean;
  status: OfferStatus;
  editStatus: EditStatus;
  createdAt: string;
  imageBase64?: string | null;
  // Market sale
  marketSaleEnabled?: boolean;
  marketPrice?: number;
  marketMinimumQuantity?: number;
  marketStock?: number;
  // Collective sale
  collectiveSaleEnabled?: boolean;
  progressiveTiers?: ProgressiveTier[];
  collectiveDeadline?: string;
  collectiveMinimumQuantity?: number;
}

export type ReservationStatus =
  | "reservado"
  | "aguardando_meta"
  | "faixa_atingida"
  | "meta_atingida"
  | "prazo_finalizado"
  | "ordem_gerada"
  | "em_tratativa_com_fornecedor"
  | "venda_concluida"
  | "cliente_nao_cumpriu"
  | "cancelado"
  | "confirmado"
  | "entregue"
  | "em_andamento"
  | "meta_batida";

export interface Reservation {
  id: string;
  offerId: string;
  supplierId: string;
  buyerId: string;
  buyerType?: BuyerType;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  finalPrice?: number | null;
  finalTotal?: number | null;
  product: string;
  brand: string;
  category: string;
  buyerSnapshot: Pick<BuyerProfile, "companyName" | "cnpj" | "contactName" | "whatsapp" | "email" | "city" | "segment">;
  supplierSnapshot: Pick<SupplierProfile, "companyName" | "cnpj" | "contactName" | "whatsapp" | "email" | "city">;
  status: ReservationStatus;
  purchaseMode?: PurchaseMode;
  createdAt: string;
}

export type MarketOrderStatus =
  | "ordem_gerada"
  | "fornecedor_notificado"
  | "em_tratativa_com_fornecedor"
  | "venda_concluida"
  | "cliente_nao_cumpriu"
  | "cancelada";

export interface MarketOrder {
  id: string;
  offerId: string;
  supplierId: string;
  buyerId: string;
  buyerType?: BuyerType;
  purchaseMode: "market";
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  product: string;
  unit: string;
  buyerSnapshot: Pick<BuyerProfile, "companyName" | "cnpj" | "contactName" | "whatsapp" | "email" | "city" | "segment">;
  supplierSnapshot: Pick<SupplierProfile, "companyName" | "cnpj" | "contactName" | "whatsapp" | "email" | "city">;
  status: MarketOrderStatus;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  order: number;
  subcategories: string[];
}

export interface City {
  id: string;
  name: string;
  state: string;
  active: boolean;
  order: number;
}

export type RatingTarget = "buyer" | "supplier";

export interface Rating {
  id: string;
  reservationId: string;
  offerId: string;
  fromUserId: string;
  fromRole: UserRole;
  targetId: string;
  targetType: RatingTarget;
  score: number;
  comment: string;
  createdAt: string;
}
