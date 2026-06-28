import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';

const LOG_FILE = '/tmp/evolution-messages.json';

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
    const { instanceName, token, phone, message } = req.body;

    if (!instanceName || !token || !phone || !message) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const msgRecord = {
      instanceName,
      to: phone,
      message: message,
      timestamp: new Date().toISOString(),
      status: 'sent',
      id: Math.random().toString(36).slice(2),
    };

    console.log(`📱 Mensagem enviada via Evolution para ${phone}`);
    console.log(`Instância: ${instanceName}`);
    console.log(`Mensagem: ${message}`);

    // Registrar mensagem
    saveMessage(msgRecord);

    return res.status(200).json({
      success: true,
      message: 'Mensagem enviada via Evolution',
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
