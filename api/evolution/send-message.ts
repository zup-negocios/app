import type { VercelRequest, VercelResponse } from '@vercel/node';

// Armazenar mensagens simuladas em memória (durante a sessão)
const simulatedMessages: any[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { instanceName, token, phone, message } = req.body;

    if (!instanceName || !token || !phone || !message) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    console.log(`📱 Enviando mensagem (SIMULADO) para ${phone}`);
    console.log(`Instância: ${instanceName}`);
    console.log(`Mensagem: ${message}`);

    // Simular envio de mensagem
    const messageRecord = {
      id: Math.random().toString(36).slice(2),
      instanceName,
      to: phone,
      message: message,
      timestamp: new Date().toISOString(),
      status: 'sent',
      isSimulated: true,
    };

    simulatedMessages.push(messageRecord);

    // Mostrar no console
    console.log(`✅ Mensagem simulada enviada para ${phone}`);
    console.log(`ID: ${messageRecord.id}`);

    return res.status(200).json({
      success: true,
      message: '✅ Mensagem simulada enviada com sucesso',
      messageId: messageRecord.id,
      to: phone,
      isSimulated: true,
      timestamp: messageRecord.timestamp,
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
