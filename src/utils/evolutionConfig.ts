// Configuração Evolution API para WhatsApp
// URL do servidor Evolution rodando localmente via Docker
const EVOLUTION_BASE_URL = "http://localhost:8080";
const EVOLUTION_API_KEY = "zup_evolution_key_123";

export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
  token: string;
  qrCode: string | null;
  isConnected: boolean;
  connectedPhone: string | null;
}

const DEFAULT_CONFIG: EvolutionConfig = {
  baseUrl: EVOLUTION_BASE_URL,
  apiKey: EVOLUTION_API_KEY,
  instanceName: "zup",
  token: "",
  qrCode: null,
  isConnected: false,
  connectedPhone: null,
};

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

export async function createEvolutionInstance(): Promise<{
  qrCode: string | null;
  instanceName: string;
  success: boolean;
  message: string;
}> {
  try {
    const instanceName = `zup-${Date.now()}`;
    const response = await fetch("/api/evolution/create-instance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceName }),
    });

    const data = await response.json();

    if (response.ok && data.qrCode) {
      return {
        qrCode: data.qrCode,
        instanceName,
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

export async function connectEvolution(instanceName: string, token: string): Promise<boolean> {
  try {
    const response = await fetch("/api/evolution/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instanceName, token }),
    });

    if (response.ok) {
      saveEvolutionConfig({ instanceName, token, isConnected: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error("Erro ao conectar Evolution:", error);
    return false;
  }
}

export function disconnectEvolution() {
  saveEvolutionConfig({
    instanceName: "zup",
    token: "",
    qrCode: null,
    isConnected: false,
    connectedPhone: null,
  });
}

export async function sendViaEvolution(phone: string, message: string): Promise<boolean> {
  const config = getEvolutionConfig();

  if (!config.isConnected || !config.token) {
    console.warn("Evolution não conectado");
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
        message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return false;
  }
}
