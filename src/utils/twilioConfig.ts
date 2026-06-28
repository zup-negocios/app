// Configuração Twilio para WhatsApp

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  isConfigured: boolean;
}

const DEFAULT_CONFIG: TwilioConfig = {
  accountSid: "",
  authToken: "",
  phoneNumber: "",
  isConfigured: false,
};

/**
 * Salvar configuração Twilio
 */
export function saveTwilioConfig(config: Partial<TwilioConfig>) {
  try {
    const current = getTwilioConfig();
    const updated = { ...current, ...config };

    // Verificar se tem todas as credenciais
    if (config.accountSid || config.authToken || config.phoneNumber) {
      updated.isConfigured = !!(updated.accountSid && updated.authToken && updated.phoneNumber);
    }

    localStorage.setItem("zup_twilio_config", JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Erro ao salvar config Twilio:", e);
    return null;
  }
}

/**
 * Obter configuração Twilio
 */
export function getTwilioConfig(): TwilioConfig {
  try {
    const stored = localStorage.getItem("zup_twilio_config");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Erro ao carregar config Twilio:", e);
  }
  return DEFAULT_CONFIG;
}

/**
 * Enviar mensagem via Twilio WhatsApp
 */
export async function sendViatwilio(
  to: string,
  message: string
): Promise<boolean> {
  const config = getTwilioConfig();

  if (!config.isConfigured) {
    console.warn("⚠️ Twilio não configurado");
    return false;
  }

  try {
    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountSid: config.accountSid,
        authToken: config.authToken,
        from: `whatsapp:${config.phoneNumber}`,
        to: `whatsapp:+${to.replace(/\D/g, "")}`,
        body: message,
      }),
    });

    if (response.ok) {
      console.log(`✅ Mensagem enviada via Twilio para +${to}`);
      return true;
    } else {
      console.warn(`⚠️ Erro ao enviar via Twilio`);
      return false;
    }
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", error);
    return false;
  }
}

/**
 * Testar conexão Twilio
 */
export async function testTwilioConnection(): Promise<boolean> {
  const config = getTwilioConfig();

  if (!config.isConfigured) {
    console.error("Twilio não configurado");
    return false;
  }

  try {
    const response = await fetch("/api/whatsapp/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountSid: config.accountSid,
        authToken: config.authToken,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Erro ao testar Twilio:", error);
    return false;
  }
}
