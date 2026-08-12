import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { instanceName, token } = req.body;

    if (!instanceName || !token) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    console.log(`✅ Validando instância Evolution (SIMULADO): ${instanceName}`);
    // Simular validação bem-sucedida
    return res.status(200).json({
      success: true,
      message: '✅ Instância validada com sucesso (simulador)',
      instanceName: instanceName,
      isConnected: true,
      isSimulated: true,    });
  } catch (error) {
    console.error('Erro ao validar:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao validar instância',
      isConnected: false,
    });
  }
}
