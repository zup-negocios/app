import type { Offer, SupplierProfile } from "../types";

interface WhatsAppMessage {
  to: string;
  message: string;
  timestamp: string;
  type: "coletiva_nova" | "coletiva_meta" | "imediata";
}

// Armazenar histórico de mensagens (em produção usar banco de dados)
const messageHistory: WhatsAppMessage[] = [];

// Configuração do Twilio (adicionar variáveis de ambiente em produção)
const TWILIO_ENABLED = false; // Mudar para true quando ativar Twilio
const TWILIO_ACCOUNT_SID = import.meta.env.REACT_APP_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.REACT_APP_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = import.meta.env.REACT_APP_TWILIO_PHONE_NUMBER;

/**
 * Formata número de telefone para formato WhatsApp (+55XX9XXXX-XXXX)
 */
function formatPhoneToWhatsApp(phone: string): string {
  // Remove caracteres especiais
  const cleaned = phone.replace(/\D/g, "");

  // Se já tem +55, retorna direto
  if (cleaned.startsWith("55")) {
    return `+${cleaned}`;
  }

  // Adiciona +55
  return `+55${cleaned}`;
}

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
 * Função base para enviar mensagem WhatsApp
 */
async function sendWhatsAppMessage(
  phone: string,
  message: string,
  type: WhatsAppMessage["type"]
): Promise<boolean> {
  const whatsappPhone = formatPhoneToWhatsApp(phone);
  const timestamp = new Date().toISOString();

  // Registrar no histórico (simulação local)
  messageHistory.push({
    to: whatsappPhone,
    message,
    timestamp,
    type,
  });

  try {
    if (TWILIO_ENABLED && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
      // Usar Twilio em produção
      return await sendViaTwilio(whatsappPhone, message);
    } else {
      // Modo simulação (desenvolvimento)
      console.log("📱 [WhatsApp Simulado]");
      console.log(`Para: ${whatsappPhone}`);
      console.log(`Tipo: ${type}`);
      console.log(`Mensagem:\n${message}`);
      console.log("---");

      // Simular sucesso
      return true;
    }
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    return false;
  }
}

/**
 * Integração com Twilio (quando ativar)
 */
async function sendViaTwilio(to: string, message: string): Promise<boolean> {
  try {
    // Exemplo usando fetch (adaptar conforme API do Twilio)
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization":
            "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        },
        body: new URLSearchParams({
          From: `whatsapp:${TWILIO_PHONE_NUMBER}`,
          To: `whatsapp:${to}`,
          Body: message,
        }).toString(),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Erro Twilio:", error);
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
