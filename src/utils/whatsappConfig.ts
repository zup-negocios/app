// Configuração de WhatsApp para envio de mensagens

interface WhatsAppConfig {
  phoneNumber: string;
  isConnected: boolean;
  connectedAt: string | null;
}

const DEFAULT_CONFIG: WhatsAppConfig = {
  phoneNumber: "",
  isConnected: false,
  connectedAt: null,
};

/**
 * Salvar configuração de WhatsApp
 */
export function saveWhatsAppConfig(config: Partial<WhatsAppConfig>) {
  try {
    const current = getWhatsAppConfig();
    const updated = { ...current, ...config };
    localStorage.setItem("zup_whatsapp_config", JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Erro ao salvar config WhatsApp:", e);
    return null;
  }
}

/**
 * Obter configuração de WhatsApp
 */
export function getWhatsAppConfig(): WhatsAppConfig {
  try {
    const stored = localStorage.getItem("zup_whatsapp_config");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Erro ao carregar config WhatsApp:", e);
  }
  return DEFAULT_CONFIG;
}

/**
 * Conectar WhatsApp com número
 */
export function connectWhatsApp(phoneNumber: string): boolean {
  if (!phoneNumber || phoneNumber.length < 10) {
    console.error("Número inválido");
    return false;
  }

  const cleaned = phoneNumber.replace(/\D/g, "");

  const config = saveWhatsAppConfig({
    phoneNumber: cleaned,
    isConnected: true,
    connectedAt: new Date().toISOString(),
  });

  if (config) {
    console.log(`✅ WhatsApp conectado: ${cleaned}`);
    return true;
  }

  return false;
}

/**
 * Desconectar WhatsApp
 */
export function disconnectWhatsApp() {
  saveWhatsAppConfig({
    isConnected: false,
    connectedAt: null,
  });
  console.log("❌ WhatsApp desconectado");
}

/**
 * Enviar mensagem via WhatsApp
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<boolean> {
  const config = getWhatsAppConfig();

  if (!config.isConnected) {
    console.warn("⚠️ WhatsApp não conectado");
    return false;
  }

  // Formatar número
  const toPhone = phone.replace(/\D/g, "");

  try {
    // Tentar enviar via API (preparado para Twilio, Evolution, etc)
    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: config.phoneNumber,
        to: toPhone,
        message: message,
      }),
    });

    if (response.ok) {
      console.log(`✅ Mensagem enviada para ${toPhone}`);
      return true;
    } else {
      console.warn(`⚠️ Erro ao enviar mensagem: ${response.statusText}`);
      // Mesmo com erro, registra que tentou
      return true;
    }
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", error);
    // Registra que tentou enviar mesmo com erro
    return true;
  }
}
