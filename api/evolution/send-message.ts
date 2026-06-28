import type { VercelRequest, VercelResponse } from '@vercel/node';

const EVOLUTION_URL = "http://localhost:8080";
const EVOLUTION_API_KEY = "zup_evolution_key_123";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { instanceName, token, phone, message } = req.body;

    if (!instanceName || !token || !phone || !message) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    console.log(`📱 Enviando mensagem via Evolution para ${phone}`);
    console.log(`Instância: ${instanceName}`);
    console.log(`Mensagem: ${message}`);

    // Chamar Evolution API para enviar mensagem
    const sendResponse = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    }).catch(err => {
      console.error('Erro ao enviar via Evolution:', err);
      return null;
    });

    if (!sendResponse || !sendResponse.ok) {
      console.warn(`⚠️ Erro ao enviar mensagem para ${phone}`);
      return res.status(400).json({
        success: false,
        message: 'Erro ao enviar mensagem',
        to: phone,
      });
    }

    const data = await sendResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Mensagem enviada via Evolution',
      messageId: data.key?.id || Math.random().toString(36).slice(2),
      to: phone,
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem',
      details: (error as any).message,
    });
  }
}
