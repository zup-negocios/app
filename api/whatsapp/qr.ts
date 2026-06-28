import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';

let sock: any = null;
let lastQR: string = '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Se já está conectado, retornar status
    if (sock && sock.user) {
      return res.status(200).json({
        connected: true,
        user: {
          id: sock.user.id,
          name: sock.user.name,
        },
      });
    }

    // Se já tem QR code armazenado, retornar
    if (lastQR) {
      return res.status(200).json({
        connected: false,
        qr: lastQR,
      });
    }

    // Inicializar conexão e esperar QR code
    const authDir = path.join('/tmp', 'zup-baileys-auth-info');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['Zup', 'Chrome', '1.0.0'],
    });

    let qrGenerated = false;

    sock.ev.on('connection.update', (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !qrGenerated) {
        lastQR = qr;
        qrGenerated = true;
        console.log('📱 QR code gerado');
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log('Reconectando...');
          sock = null;
        }
      } else if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp!');
        lastQR = '';
      }
    });

    sock.ev.on('creds.update', saveCreds);

    // Esperar QR code ou conexão bem-sucedida (máx 30s)
    return await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (lastQR) {
          resolve(
            res.status(200).json({
              connected: false,
              qr: lastQR,
              message: 'Escaneie o QR code com seu WhatsApp',
            })
          );
        } else if (sock && sock.user) {
          resolve(
            res.status(200).json({
              connected: true,
              user: {
                id: sock.user.id,
                name: sock.user.name,
              },
            })
          );
        } else {
          resolve(
            res.status(500).json({
              error: 'Timeout ao gerar QR code',
            })
          );
        }
      }, 30000);

      const checkInterval = setInterval(() => {
        if (lastQR || (sock && sock.user)) {
          clearTimeout(timeout);
          clearInterval(checkInterval);

          if (sock && sock.user) {
            resolve(
              res.status(200).json({
                connected: true,
                user: {
                  id: sock.user.id,
                  name: sock.user.name,
                },
              })
            );
          } else {
            resolve(
              res.status(200).json({
                connected: false,
                qr: lastQR,
                message: 'Escaneie o QR code com seu WhatsApp',
              })
            );
          }
        }
      }, 500);
    });
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    return res.status(500).json({
      error: 'Erro ao gerar QR code',
      details: (error as any).message,
    });
  }
}
