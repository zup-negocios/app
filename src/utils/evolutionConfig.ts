// Configuração Evolution API para WhatsApp

interface EvolutionConfig {
  instanceName: string;
  token: string;
  qrCode: string | null;
  isConnected: boolean;
  connectedPhone: string | null;
}

const DEFAULT_CONFIG: EvolutionConfig = {
  instanceName: "zup",
  token: "",
  qrCode: null,
  isConnected: false,
  connectedPhone: null,
};

/**
 * Salvar configuração Evolution
 */
export function saveEvolutionConfig(config: Partial<EvolutionConfig>) {
  try {
    const current = getEvolutionConfig();
    const updated = { ...current, ...config };
    localStorage.setItem("zup_evolution_config", JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Erro ao salvar config Evolution:", e);
    return null;
  }
}

/**
 * Obter configuração Evolution
 */
export function getEvolutionConfig(): EvolutionConfig {
  try {
    const stored = localStorage.getItem("zup_evolution_config");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Erro ao carregar config Evolution:", e);
  }
  return DEFAULT_CONFIG;
}

/**
 * Criar nova instância Evolution e obter QR code
 */
export async function createEvolutionInstance(): Promise<{
  qrCode: string | null;
  instanceName: string;
  success: boolean;
  message: string;
}> {
  try {
    const instanceName = `zup-${Date.now()}`;

    // Chamada à Evolution API para criar instância
    const response = await fetch("/api/evolution/create-instance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceName }),
    });

    const data = await response.json();

    if (response.ok && data.qrCode) {
      console.log("✅ Instância Evolution criada");
      return {
        qrCode: data.qrCode,
        instanceName: instanceName,
        success: true,
        message: "QR Code gerado. Escaneie com seu WhatsApp!",
      };
    } else {
      return {
        qrCode: null,
        instanceName: "",
        success: false,
        message: data.message || "Erro ao criar instância",
      };
    }
  } catch (error) {
    console.error("Erro ao criar instância Evolution:", error);
    return {
      qrCode: null,
      instanceName: "",
      success: false,
      message: "Erro de conexão",
    };
  }
}

/**
 * Conectar usando token Evolution
 */
export async function connectEvolution(
  instanceName: string,
  token: string
): Promise<boolean> {
  try {
    // Validar conexão
    const response = await fetch("/api/evolution/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceName, token }),
    });

    if (response.ok) {
      saveEvolutionConfig({
        instanceName,
        token,
        isConnected: true,
      });
      console.log("✅ Evolution conectado");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Erro ao conectar Evolution:", error);
    return false;
  }
}

/**
 * Desconectar Evolution
 */
export function disconnectEvolution() {
  saveEvolutionConfig({
    instanceName: "zup",
    token: "",
    qrCode: null,
    isConnected: false,
    connectedPhone: null,
  });
  console.log("❌ Evolution desconectado");
}

/**
 * Enviar mensagem via Evolution API
 */
export async function sendViaEvolution(
  phone: string,
  message: string
): Promise<boolean> {
  const config = getEvolutionConfig();

  if (!config.isConnected || !config.token) {
    console.warn("⚠️ Evolution não conectado");
    return false;
  }

  try {
    const response = await fetch("/api/evolution/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceName: config.instanceName,
        token: config.token,
        phone: phone.replace(/\D/g, ""),
        message: message,
      }),
    });

    if (response.ok) {
      console.log(`✅ Mensagem enviada via Evolution para ${phone}`);
      return true;
    } else {
      console.warn(`⚠️ Erro ao enviar via Evolution`);
      return false;
    }
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem:", error);
    return false;
  }
}
