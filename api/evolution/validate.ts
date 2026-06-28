import type { VercelRequest, VercelResponse } from '@vercel/node';

const EVOLUTION_URL = "http://localhost:8080";
const EVOLUTION_API_KEY = "zup_evolution_key_123";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { instanceName, token } = req.body;

    if (!instanceName || !token) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    console.log(`✅ Validando instância Evolution: ${instanceName}`);

    // Chamar Evolution API para validar conexão
    const validateResponse = await fetch(`${EVOLUTION_URL}/instance/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
    }).catch(err => {
      console.error('Erro ao validar Evolution API:', err);
      return null;
    });

    if (!validateResponse || !validateResponse.ok) {
      return res.status(503).json({
        success: false,
        message: '❌ Evolution API não está rodando',
        isConnected: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Instância validada com sucesso',
      instanceName: instanceName,
      isConnected: true,
    });
  } catch (error) {
    console.error('Erro ao validar:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao validar instância',
      isConnected: false,
    });
  }
}
