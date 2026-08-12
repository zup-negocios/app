// Notificações WhatsApp - Disparos automáticos de eventos
// import toast from "react-hot-toast";

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_PHONE = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

export const isWhatsAppEnabled = () => !!TWILIO_ACCOUNT_SID && !!TWILIO_PHONE;

export const sendWhatsAppNotification = async (
  phoneNumber: string,
  message: string
) => {
  if (!isWhatsAppEnabled()) {
    console.warn("⚠️ WhatsApp não configurado. Mensagem: " + message);
    return { success: false };
  }

  try {
    // Se tiver servidor backend, enviar para lá
    // Por enquanto, apenas log (você configurará a integração depois)
    console.log(`📱 WhatsApp para ${phoneNumber}: ${message}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    return { success: false };
  }
};

export const templates = {
  buyerSignup: (name: string) => `
🎉 Bem-vindo à Zup, ${name}!

Você agora faz parte de nossa comunidade de compras coletivas.

Acesse: zup.com.br/comprador
WhatsApp: (41) 99727-4271

Aproveite as melhores ofertas! 🛍️
  `.trim(),

  supplierSignup: (name: string) => `
🚀 Bem-vindo à Zup, ${name}!

Sua conta foi criada com sucesso!

Acesse: zup.com.br/fornecedor
WhatsApp: (41) 99727-4271

Comece a criar suas ofertas agora!
  `.trim(),

  offerPublished: (supplierName: string, productName: string) => `
✅ ${supplierName}, sua oferta foi publicada!

📦 ${productName}

Compradores já podem ver sua oferta no marketplace!
  `.trim(),

  newReservation: (buyerName: string, productName: string, quantity: string) => `
🛒 Nova reserva confirmada, ${buyerName}!

📦 ${productName}
📊 Quantidade: ${quantity}

Acompanhe no sistema!
  `.trim(),

  metaAchieved: (supplierName: string, productName: string) => `
🎯 META ATINGIDA, ${supplierName}!

🏆 ${productName}

Compradores confirmados! Processe as entregas.
  `.trim(),
};
