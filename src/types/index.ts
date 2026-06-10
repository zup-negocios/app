export type UserRole = "buyer" | "supplier";
export type SupplierPlan = "gratuito" | "assinante";
export type TargetType = "quantity" | "amount";
export type EditStatus = "edicao_livre" | "edicao_bloqueada" | "edicao_solicitada" | "edicao_aprovada" | "edicao_recusada";

export interface BuyerProfile {
  id: string;
  role: "buyer";
  companyName: string;
  cnpj: string;
  contactName: string;
  whatsapp: string;
  email: string;
  password: string;
  city: string;
  segment: string;
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
  paymentTerms: string;
  deliveryTime: string;
  notes: string;
  approved: boolean;
  status: OfferStatus;
  editStatus: EditStatus;
  createdAt: string;
  imageBase64?: string | null;
}

export type ReservationStatus =
  | "reservado"
  | "aguardando_meta"
  | "meta_atingida"
  | "confirmado"
  | "entregue"
  | "cancelado"
  | "em_andamento"
  | "meta_batida";

export interface Reservation {
  id: string;
  offerId: string;
  supplierId: string;
  buyerId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  product: string;
  brand: string;
  category: string;
  buyerSnapshot: Pick<BuyerProfile, "companyName" | "cnpj" | "contactName" | "whatsapp" | "email" | "city" | "segment">;
  supplierSnapshot: Pick<SupplierProfile, "companyName" | "cnpj" | "contactName" | "whatsapp" | "email" | "city">;
  status: ReservationStatus;
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
