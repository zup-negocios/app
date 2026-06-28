import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simular um QR code com SVG
function generateMockQRCode(): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="white"/>
      <rect x="10" y="10" width="40" height="40" fill="black"/>
      <rect x="150" y="10" width="40" height="40" fill="black"/>
      <rect x="10" y="150" width="40" height="40" fill="black"/>
      <text x="100" y="100" font-size="16" text-anchor="middle" fill="black">
        WhatsApp Conectado ✅
      </text>
      <text x="100" y="120" font-size="12" text-anchor="middle" fill="#666">
        Simulador (Teste)
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { instanceName } = req.body;

    if (!instanceName) {
      return res.status(400).json({ error: 'Missing instanceName' });
    }

    console.log(`📱 Criando instância Evolution (SIMULADO): ${instanceName}`);

    // Gerar QR code simulado
    const qrCode = generateMockQRCode();

    console.log(`✅ QR Code gerado para ${instanceName} (SIMULADOR)`);
    return res.status(200).json({
      success: true,
      instanceName: instanceName,
      qrCode: qrCode,
      message: '✅ QR Code gerado (modo simulador)',
      isSimulated: true,
    });
  } catch (error) {
    console.error('Erro ao criar instância:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar QR Code',
      error: (error as any).message,
    });
  }
}
