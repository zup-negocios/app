import type { VercelRequest, VercelResponse } from '@vercel/node';

const EVOLUTION_URL = "http://localhost:8080";
const EVOLUTION_API_KEY = "zup_evolution_key_123";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { instanceName } = req.body;

    if (!instanceName) {
      return res.status(400).json({ error: 'Missing instanceName' });
    }

    console.log(`📱 Criando instância Evolution: ${instanceName}`);

    // Chamar Evolution API para criar instância
    const createResponse = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
      }),
    }).catch(err => {
      console.error('Erro ao conectar Evolution API:', err);
      return null;
    });

    if (!createResponse || !createResponse.ok) {
      // Se Evolution não está rodando, retornar erro informativo
      return res.status(503).json({
        success: false,
        message: '❌ Evolution API não está rodando. Execute: docker-compose up -d',
        qrCode: null,
      });
    }

    const data = await createResponse.json();

    if (data.qrcode) {
      console.log(`✅ QR Code gerado para ${instanceName}`);
      return res.status(200).json({
        success: true,
        instanceName: instanceName,
        qrCode: `data:image/png;base64,${data.qrcode.base64}`,
        message: 'QR Code gerado com sucesso',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Erro ao gerar QR Code',
        qrCode: null,
      });
    }
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    return res.status(500).json({
      success: false,
      message: '❌ Evolution API não está respondendo. Verifique se Docker está rodando: docker-compose up -d',
      error: (error as any).message,
    });
  }
}
