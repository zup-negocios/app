import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Missing phone or message' });
    }

    // Variáveis de ambiente
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE = process.env.TWILIO_PHONE;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
      return res.status(500).json({
        success: false,
        error: 'Twilio credentials not configured',
      });
    }

    const formattedPhone = `whatsapp:+${phone.replace(/\D/g, '')}`;

    // Chamar Twilio API
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: `whatsapp:${TWILIO_PHONE}`,
          To: formattedPhone,
          Body: message,
        }).toString(),
      }
    );

    const data = await twilioResponse.json();

    if (twilioResponse.ok && data.sid) {
      console.log(`✅ WhatsApp enviado via Twilio para ${phone}`);
      return res.status(200).json({
        success: true,
        message: 'Mensagem enviada com sucesso',
        messageId: data.sid,
        to: phone,
      });
    } else {
      console.error('Erro Twilio:', data);
      return res.status(400).json({
        success: false,
        message: 'Erro ao enviar mensagem',
        error: data.message || 'Unknown error',
      });
    }
  } catch (error) {
    console.error('Erro ao enviar WhatsApp:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem',
      details: (error as any).message,
    });
  }
}
