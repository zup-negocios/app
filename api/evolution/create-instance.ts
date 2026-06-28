import type { VercelRequest, VercelResponse } from '@vercel/node';

// Em desenvolvimento, simulamos a resposta
// Em produção, aponte para seu servidor Evolution API

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { instanceName } = req.body;

    if (!instanceName) {
      return res.status(400).json({ error: 'Instance name is required' });
    }

    console.log(`📱 Criando instância Evolution: ${instanceName}`);

    // Simular QR Code (em produção chamar Evolution API real)
    const simulatedQRCode = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;

    return res.status(200).json({
      success: true,
      instanceName: instanceName,
      qrCode: simulatedQRCode,
      message: 'Instância criada. Escaneie o QR Code com seu WhatsApp!',
      instructions: 'Aponte a câmera para este código e confirme no WhatsApp',
    });
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    return res.status(500).json({
      error: 'Erro ao criar instância',
      details: (error as any).message,
    });
  }
}
