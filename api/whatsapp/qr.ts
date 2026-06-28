import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as fs from 'fs';
import * as path from 'path';

const STATE_FILE = '/tmp/whatsapp-state.json';

function getState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.log('Estado não encontrado');
  }
  return { connected: false, qr: null, user: null };
}

function setState(state: any) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state), 'utf-8');
  } catch (e) {
    console.log('Erro ao salvar estado');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const state = getState();

    // Se já está conectado
    if (state.connected && state.user) {
      return res.status(200).json({
        connected: true,
        user: state.user,
      });
    }

    // Se não, precisamos gerar novo QR
    // Por enquanto, retorna que precisa fazer setup manual
    return res.status(200).json({
      connected: false,
      qr: null,
      setup_required: true,
      message: 'Para usar o WhatsApp Zup, faça login em seu celular',
      status: 'awaiting_phone_scan',
    });
  } catch (error) {
    console.error('Erro:', error);
    return res.status(200).json({
      connected: false,
      error: 'Erro ao verificar status',
    });
  }
}
