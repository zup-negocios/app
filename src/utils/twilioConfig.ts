// Configuração Twilio para WhatsApp

export async function sendViaWhatsApp(
  phone: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: phone.replace(/\D/g, ""),
        message: message,
      }),
    });

    if (response.ok) {
      console.log(`✅ Mensagem WhatsApp enviada para ${phone}`);
      return true;
    } else {
      console.warn(`⚠️ Erro ao enviar WhatsApp para ${phone}`);
      return false;
    }
  } catch (error) {
    console.error("Erro ao enviar WhatsApp:", error);
    return false;
  }
}
