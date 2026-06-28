import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';

let sock: any = null;
let isConnecting = false;

async function initializeSocket() {
  if (sock && sock.user) {
    return sock;
  }

  if (isConnecting) {
    // Aguarda se já está tentando conectar
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (sock && sock.user) {
          clearInterval(checkInterval);
          resolve(sock);
        }
      }, 500);
      setTimeout(() => clearInterval(checkInterval), 30000);
    });
  }

  isConnecting = true;

  try {
    // Usar diretório temporário do Vercel para autenticação
    const authDir = path.join('/tmp', 'zup-baileys-auth-info');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['Zup', 'Chrome', '1.0.0'],
    });

    sock.ev.on('connection.update', (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('📱 QR Code gerado, escaneie com seu WhatsApp');
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          isConnecting = false;
          sock = null;
          initializeSocket();
        }
      } else if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp!');
        isConnecting = false;
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Aguardar conexão
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (sock && sock.user) {
          clearInterval(checkInterval);
          resolve(sock);
        }
      }, 500);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(sock);
      }, 30000);
    });
  } catch (error) {
    console.error('Erro ao inicializar WhatsApp:', error);
    isConnecting = false;
    throw error;
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

    // Formatar número para formato WhatsApp
    const formattedPhone = phone.replace(/\D/g, '');
    const phoneId = formattedPhone.startsWith('55')
      ? `${formattedPhone}@s.whatsapp.net`
      : `55${formattedPhone}@s.whatsapp.net`;

    console.log(`📤 Enviando mensagem para ${phoneId}`);

    // Inicializar socket se necessário
    const waSocket = await initializeSocket();

    if (!waSocket || !waSocket.user) {
      return res.status(503).json({
        error: 'WhatsApp não conectado',
        message: 'Escaneie o QR code com seu WhatsApp no dashboard',
        qrNeeded: true
      });
    }

    // Enviar mensagem
    await waSocket.sendMessage(phoneId, {
      text: message,
    });

    console.log(`✅ Mensagem enviada para ${phoneId}`);

    return res.status(200).json({
      success: true,
      message: 'Mensagem enviada com sucesso',
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
