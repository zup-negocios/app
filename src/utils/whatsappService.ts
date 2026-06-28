import type { Offer, SupplierProfile } from "../types";

interface WhatsAppMessage {
  to: string;
  message: string;
  timestamp: string;
  type: "coletiva_nova" | "coletiva_meta" | "imediata";
}

// Armazenar histórico de mensagens
const messageHistory: WhatsAppMessage[] = [];

// Detectar ambiente
const API_BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://zup-negocios.vercel.app';

/**
 * Enviar mensagem de nova compra coletiva
 */
export async function sendCollectiveOrderMessage(
  offer: Offer,
  currentReservations: number,
  supplier: SupplierProfile
): Promise<boolean> {
  const targetQty = offer.targetQuantity || 0;
  const progress = (currentReservations / targetQty) * 100;

  const message = `🎉 Ótima notícia!
Mais uma reserva chegou na sua oferta!

📦 Oferta: ${offer.product}
📊 Progresso: ${Math.round(progress)}% da meta (${currentReservations.toLocaleString("pt-BR")}/${targetQty.toLocaleString("pt-BR")} ${offer.unit})
⏳ Prazo: até ${offer.deadline}

Bora chegar nessa meta! 💪`;

  return sendWhatsAppMessage(supplier.whatsapp, message, "coletiva_nova");
}

/**
 * Enviar mensagem de meta atingida (apenas resumo, sem dados dos compradores)
 */
export async function sendMetaAchievedMessage(
  offer: Offer,
  totalQuantity: number,
  totalAmount: number,
  buyerCount: number,
  supplier: SupplierProfile
): Promise<boolean> {
  const message = `🚀 META ATINGIDA! 🚀

Sua oferta "${offer.product}"
atingiu a meta!

📊 ${totalQuantity.toLocaleString("pt-BR")} ${offer.unit} reservados
💰 Total: R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
👥 ${buyerCount} comprador(es)

Detalhes dos clientes: veja no sistema
Próximo passo: Confirme entrega 📞`;

  return sendWhatsAppMessage(supplier.whatsapp, message, "coletiva_meta");
}

/**
 * Enviar mensagem de venda imediata
 */
export async function sendImmediateOrderMessage(
  offer: Offer,
  quantity: number,
  totalAmount: number,
  buyerName: string,
  supplier: SupplierProfile
): Promise<boolean> {
  const message = `🔥 VENDA IMEDIATA! 🔥

PARABÉNS! Você acaba de vender!

📦 ${offer.product}
💰 ${quantity} ${offer.unit} = R$ ${totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
⏱️ Agora: ${new Date().toLocaleTimeString("pt-BR")}
👤 Cliente: ${buyerName}

Relatório completo no sistema ➜ /fornecedor/minhas-vendas

Próximas vendas chegando! 🚀`;

  return sendWhatsAppMessage(supplier.whatsapp, message, "imediata");
}

/**
 * Função base para enviar mensagem WhatsApp via Baileys
 */
async function sendWhatsAppMessage(
  phone: string,
  message: string,
  type: WhatsAppMessage["type"]
): Promise<boolean> {
  const cleanedPhone = phone.replace(/\D/g, "");
  const timestamp = new Date().toISOString();

  // Registrar no histórico
  messageHistory.push({
    to: cleanedPhone,
    message,
    timestamp,
    type,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/whatsapp/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: cleanedPhone,
        message,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ WhatsApp enviado:", data);
      return true;
    } else {
      const errorData = await response.json();
      console.warn("⚠️ Erro ao enviar WhatsApp:", errorData);

      // Se não está conectado, mostra aviso mas não bloqueia o fluxo
      if (errorData.qrNeeded) {
        console.log("📱 QR code necessário! Acesse /admin/whatsapp-setup para conectar");
      }

      return false;
    }
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    return false;
  }
}

/**
 * Obter histórico de mensagens enviadas
 */
export function getMessageHistory(): WhatsAppMessage[] {
  return [...messageHistory];
}

/**
 * Limpar histórico de mensagens
 */
export function clearMessageHistory(): void {
  messageHistory.length = 0;
}

/**
 * Obter estatísticas de mensagens
 */
export function getMessageStats() {
  return {
    total: messageHistory.length,
    collectiveNew: messageHistory.filter(m => m.type === "coletiva_nova").length,
    collectiveAchieved: messageHistory.filter(m => m.type === "coletiva_meta").length,
    immediate: messageHistory.filter(m => m.type === "imediata").length,
  };
}
