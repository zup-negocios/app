import type { VercelRequest, VercelResponse } from '@vercel/node';
<<<<<<< HEAD

// Armazenar mensagens simuladas em memória (durante a sessão)
const simulatedMessages: any[] = [];
=======
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
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { instanceName, token, phone, message } = req.body;

    if (!instanceName || !token || !phone || !message) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

<<<<<<< HEAD
    console.log(`📱 Enviando mensagem (SIMULADO) para ${phone}`);
    console.log(`Instância: ${instanceName}`);
    console.log(`Mensagem: ${message}`);

    // Simular envio de mensagem
    const messageRecord = {
      id: Math.random().toString(36).slice(2),
=======
    const msgRecord = {
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
      instanceName,
      to: phone,
      message: message,
      timestamp: new Date().toISOString(),
      status: 'sent',
<<<<<<< HEAD
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
=======
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
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return res.status(500).json({
<<<<<<< HEAD
      success: false,
=======
>>>>>>> 340ce69334e4d253477a33892d15a13154b08771
      error: 'Erro ao enviar mensagem',
      details: (error as any).message,
    });
  }
}
