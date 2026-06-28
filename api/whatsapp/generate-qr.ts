import type { VercelRequest, VercelResponse } from '@vercel/node';
import QRCode from 'qrcode';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Gerar QR code com dados de sessão
    const sessionId = `zup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const qrData = `https://zup-whatsapp.local/auth/${sessionId}`;

    // Gerar QR code em base64
    const qrImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return res.status(200).json({
      success: true,
      qr: qrImage,
      sessionId: sessionId,
      message: 'QR code gerado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    return res.status(500).json({
      error: 'Erro ao gerar QR code',
      details: (error as any).message,
    });
  }
}
