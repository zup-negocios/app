import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';

let sock: any = null;
let lastQR: string = '';
let isInitializing = false;

function cleanAuthDirectory(authDir: string) {
  try {
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      files.forEach(file => {
        const filePath = path.join(authDir, file);
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.log(`Erro ao deletar ${file}`);
        }
      });
      console.log('✅ Autenticação anterior limpa');
    }
  } catch (e) {
    console.log('Aviso: não foi possível limpar autenticação anterior');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Se já está conectado, retornar status
    if (sock && sock.user && sock.user.id) {
      console.log('✅ Usuário já conectado');
      return res.status(200).json({
        connected: true,
        user: {
          id: sock.user.id,
          name: sock.user.name,
        },
      });
    }

    // Se já tem QR code, retornar
    if (lastQR && !isInitializing) {
      console.log('📱 Retornando QR code');
      return res.status(200).json({
        connected: false,
        qr: lastQR,
      });
    }

    // Se já está inicializando, aguardar
    if (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (lastQR) {
        return res.status(200).json({
          connected: false,
          qr: lastQR,
        });
      }
    }

    isInitializing = true;
    const authDir = path.join('/tmp', 'zup-baileys-auth-info');

    console.log('🔄 Iniciando nova conexão WhatsApp...');
    cleanAuthDirectory(authDir);

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
      shouldSyncHistoryMessage: false,
    });

    let qrGenerated = false;
    let connectionOpen = false;

    return await new Promise((resolve) => {
      sock.ev.on('connection.update', (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          lastQR = qr;
          qrGenerated = true;
          console.log('✅ QR code gerado!');
        }

        if (connection === 'open') {
          connectionOpen = true;
          console.log('✅ Conectado!');
        }

        if (connection === 'close') {
          const errorCode = (lastDisconnect?.error as any)?.output?.statusCode;
          console.log('Conexão fechada:', errorCode);

          if (errorCode !== DisconnectReason.loggedOut) {
            console.log('Tentando reconectar...');
          } else {
            sock = null;
          }
        }
      });

      sock.ev.on('creds.update', saveCreds);

      // Timeout de 40 segundos
      setTimeout(() => {
        isInitializing = false;

        if (connectionOpen && sock?.user?.id) {
          resolve(res.status(200).json({
            connected: true,
            user: {
              id: sock.user.id,
              name: sock.user.name,
            },
          }));
        } else if (lastQR) {
          resolve(res.status(200).json({
            connected: false,
            qr: lastQR,
          }));
        } else {
          resolve(res.status(200).json({
            connected: false,
            qr: null,
            error: 'Timeout. WhatsApp pode estar bloqueando. Tente novamente em alguns minutos.',
          }));
        }
      }, 40000);

      // Verificar a cada segundo
      const checkInterval = setInterval(() => {
        if (connectionOpen && sock?.user?.id) {
          clearInterval(checkInterval);
          isInitializing = false;
          resolve(res.status(200).json({
            connected: true,
            user: {
              id: sock.user.id,
              name: sock.user.name,
            },
          }));
        } else if (lastQR && qrGenerated) {
          // Manter esperando por conexão, não retornar QR ainda
        }
      }, 1000);
    });
  } catch (error) {
    isInitializing = false;
    console.error('Erro:', (error as any).message);
    return res.status(200).json({
      connected: false,
      error: 'Erro na conexão. WhatsApp bloqueou a sessão. Tente novamente em 10 minutos.',
    });
  }
}
