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

/**
 * Enviar via Twilio WhatsApp
 */
async function sendViaTwilio(
  accountSid: string,
  authToken: string,
  from: string,
  to: string,
  body: string
): Promise<boolean> {
  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: from,
          To: to,
          Body: body,
        }).toString(),
      }
    );

    if (response.ok) {
      const data: any = await response.json();
      console.log(`✅ Mensagem Twilio enviada: ${data.sid}`);
      return true;
    } else {
      const error: any = await response.json();
      console.error(`❌ Erro Twilio: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error('Erro ao enviar via Twilio:', error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountSid, authToken, from, to, body } = req.body;

    if (!to || !body) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    const msgRecord = {
      from: from || 'unknown',
      to: to,
      message: body,
      timestamp: new Date().toISOString(),
      status: 'pending',
      id: Math.random().toString(36).slice(2),
    };

    // Se tem credenciais Twilio, enviar de verdade
    if (accountSid && authToken && from) {
      console.log('📱 Tentando enviar via Twilio...');

      const success = await sendViaTwilio(accountSid, authToken, from, to, body);

      msgRecord.status = success ? 'sent' : 'failed';

      saveMessage(msgRecord);

      if (success) {
        return res.status(200).json({
          success: true,
          message: 'Mensagem enviada via Twilio',
          messageId: msgRecord.id,
          to: to,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Erro ao enviar via Twilio',
          messageId: msgRecord.id,
        });
      }
    } else {
      // Modo simulação - apenas registra
      console.log(`📱 [SIMULAÇÃO] Mensagem registrada`);
      console.log(`Para: ${to}`);
      console.log(`Mensagem: ${body}`);

      msgRecord.status = 'simulated';
      saveMessage(msgRecord);

      return res.status(200).json({
        success: true,
        message: 'Mensagem registrada (modo simulação)',
        messageId: msgRecord.id,
        to: to,
        note: 'Configure Twilio para enviar de verdade',
      });
    }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    return res.status(500).json({
      error: 'Erro ao processar mensagem',
      details: (error as any).message,
    });
  }
}
