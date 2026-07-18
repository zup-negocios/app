import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Supabase é opcional - funciona com localStorage se não configurado
export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("✅ Supabase conectado!");
} else {
  console.warn("⚠️ Supabase não configurado. Usando localStorage.");
}

export const isSupabaseEnabled = () => supabase !== null;

export type Buyer = {
  id: string;
  email: string;
  password: string;
  companyName: string;
  cnpj: string;
  contactName: string;
  whatsapp: string;
  city: string;
  segment: string;
  createdAt: string;
};

export type Supplier = {
  id: string;
  email: string;
  password: string;
  companyName: string;
  cnpj: string;
  contactName: string;
  whatsapp: string;
  city: string;
  categories: string;
  supplierType: "fabricante" | "distribuidor" | "representante" | "atacadista";
  planoFornecedor: "gratuito" | "assinante";
  createdAt: string;
};

export type Offer = {
  id: string;
  supplierId: string;
  productName: string;
  category: string;
  description?: string;
  productImage?: string | null;
  normalPrice: number;
  minBuyerPurchase: number;
  shippingCost?: number;
  paymentMethods: string[];
  minCollectiveAmount: number;
  minCollectivePercentage: number;
  collectiveDeadline: string;
  marketEnabled: boolean;
  collectiveEnabled: boolean;
  tiers: Array<{ percentage: number; price: number }>;
  productUnit: string;
  productQuantity: string;
  reservations: Array<{ buyerId: string; amount: number; quantity: number }>;
  createdAt: string;
  publishedAt: string | null;
};
