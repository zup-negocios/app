import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';

const LOG_FILE = '/tmp/whatsapp-messages.json';

function getMessages() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('Log não encontrado');
  }
  return [];
}

function saveMessage(msg: any) {
  try {
    const messages = getMessages();
    messages.push(msg);
    fs.writeFileSync(LOG_FILE, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (e) {
    console.log('Erro ao salvar mensagem');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    // Simular envio de mensagem
    const msgRecord = {
      to: phone,
      message: message,
      timestamp: new Date().toISOString(),
      status: 'sent',
      id: Math.random().toString(36).slice(2),
    };

    saveMessage(msgRecord);

    console.log(`✅ Mensagem enviada para ${phone}`);
    console.log(`Conteúdo: ${message}`);

    return res.status(200).json({
      success: true,
      message: 'Mensagem registrada para envio',
      messageId: msgRecord.id,
      to: phone,
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({
      error: 'Erro ao enviar mensagem',
      details: (error as any).message,
    });
  }
}
