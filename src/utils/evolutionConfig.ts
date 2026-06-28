// Configuração Evolution API para WhatsApp
<<<<<<< HEAD
// URL do servidor Evolution rodando localmente via Docker
const EVOLUTION_BASE_URL = "http://localhost:8080";
const EVOLUTION_API_KEY = "zup_evolution_key_123";
=======
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771

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

<<<<<<< HEAD
=======
/**
 * Salvar configuração Evolution
 */
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
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

<<<<<<< HEAD
=======
/**
 * Obter configuração Evolution
 */
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
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

<<<<<<< HEAD
=======
/**
 * Criar nova instância Evolution e obter QR code
 */
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
export async function createEvolutionInstance(): Promise<{
  qrCode: string | null;
  instanceName: string;
  success: boolean;
  message: string;
}> {
  try {
    const instanceName = `zup-${Date.now()}`;

<<<<<<< HEAD
=======
    // Chamada à Evolution API para criar instância
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
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

<<<<<<< HEAD
=======
/**
 * Conectar usando token Evolution
 */
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
export async function connectEvolution(
  instanceName: string,
  token: string
): Promise<boolean> {
  try {
<<<<<<< HEAD
=======
    // Validar conexão
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
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

<<<<<<< HEAD
=======
/**
 * Desconectar Evolution
 */
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
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

<<<<<<< HEAD
=======
/**
 * Enviar mensagem via Evolution API
 */
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
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
