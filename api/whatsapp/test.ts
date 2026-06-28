import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountSid, authToken } = req.body;

    if (!accountSid || !authToken) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Testar conectando à API do Twilio
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    if (response.ok) {
      const data: any = await response.json();
      console.log(`✅ Twilio conectado: ${data.friendly_name}`);

      return res.status(200).json({
        success: true,
        message: 'Conexão Twilio validada',
        accountName: data.friendly_name,
      });
    } else {
      const error: any = await response.json();
      console.error(`❌ Erro Twilio: ${error.message}`);

      return res.status(401).json({
        success: false,
        message: 'Credenciais Twilio inválidas',
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Erro ao testar Twilio:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao testar conexão',
      details: (error as any).message,
    });
  }
}
