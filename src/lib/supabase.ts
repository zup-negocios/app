import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export let supabase: SupabaseClient | null = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Supabase conectado");
  } else {
    console.warn("Supabase nao configurado. Usando localStorage.");
  }
} catch (error) {
  console.warn("Falha ao inicializar Supabase:", error);
  supabase = null;
}

export const isSupabaseEnabled = () => supabase !== null;

// Cada tabela guarda { id, payload jsonb } - evita mismatch de schema
// com os tipos reais do app (BuyerProfile, SupplierProfile, Offer, etc.)
export async function pushRows(table: string, items: Array<{ id: string }>) {
  if (!supabase || items.length === 0) return;
  try {
    const rows = items.map((item) => ({ id: item.id, payload: item, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
    if (error) console.log(`Supabase push falhou (${table}):`, error.message);
  } catch (error) {
    console.log(`Supabase push erro (${table}):`, error);
  }
}

export async function fetchTable<T>(table: string): Promise<T[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from(table).select("id, payload");
    if (error || !data) return [];
    return data.map((row: { payload: T }) => row.payload);
  } catch (error) {
    console.log(`Supabase fetch erro (${table}):`, error);
    return [];
  }
}
