import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Check, AlertCircle, Loader, Copy } from "lucide-react";
import toast from "react-hot-toast";

export function WhatsAppSetupPage() {
  const [qr, setQr] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/whatsapp/qr");
        const data = await response.json();

        if (data.connected) {
          setConnected(true);
          setUser(data.user);
          setQr(null);
        } else if (data.qr) {
          setQr(data.qr);
          setConnected(false);
        } else {
          setError(data.message || "Erro ao gerar QR code");
        }
      } catch (err) {
        setError("Erro ao conectar com servidor");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQR();

    // Retentar a cada 30 segundos (padrão WhatsApp Web)
    const interval = setInterval(fetchQR, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyQRText = () => {
    if (qr) {
      navigator.clipboard.writeText(qr);
      toast.success("QR code copiado!");
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuração WhatsApp</h1>
          <p className="text-gray-600 mt-2">
            Configure o WhatsApp para enviar notificações automáticas
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          {loading ? (
            <div className="text-center py-12">
              <Loader size={32} className="animate-spin text-orange-600 mx-auto mb-4" />
              <p className="text-gray-600">Gerando QR code...</p>
            </div>
          ) : connected ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">✅ Conectado!</h2>
              <p className="text-gray-600 mb-4">
                WhatsApp conectado com sucesso
              </p>
              {user && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <p className="text-sm text-gray-700">
                    <strong>Conta:</strong> {user.name || user.id}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-6">
                As notificações de vendas serão enviadas automaticamente para este número
              </p>
            </div>
          ) : error || !qr ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Notificações</h2>
              <p className="text-gray-600 mb-6">As notificações de vendas serão enviadas automaticamente para seu WhatsApp</p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6 text-left space-y-4">
                <div>
                  <p className="text-sm font-bold text-blue-900 mb-2">📱 Funcionalidade Ativa</p>
                  <p className="text-sm text-blue-700">O sistema está pronto para enviar mensagens WhatsApp aos seus clientes quando:</p>
                  <ul className="text-xs text-blue-700 space-y-1 mt-2 ml-4">
                    <li>✅ Nova reserva coletiva é feita</li>
                    <li>✅ Meta de compra coletiva é atingida</li>
                    <li>✅ Venda imediata é realizada</li>
                  </ul>
                </div>

                <div className="border-t border-blue-200 pt-4">
                  <p className="text-sm font-bold text-blue-900 mb-2">💬 Próximos Passos</p>
                  <p className="text-sm text-blue-700">Para ativar notificações do WhatsApp, entre em contato conosco:</p>
                  <a href="https://wa.me/5541997274271?text=Quero%20ativar%20notificações%20WhatsApp" target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-bold text-white bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg">
                    💬 Falar com Gestor
                  </a>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500">
                <p>📧 Email: gestao.zup@gmail.com</p>
                <p>📱 WhatsApp: (41) 99727-4271</p>
              </div>
            </div>
          ) : qr ? (
            <div className="text-center py-12">
              <QRCodeCanvas qr={qr} />

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Escaneie com seu WhatsApp
              </h2>

              <ol className="text-left bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6 space-y-2">
                <li className="text-sm text-gray-700">
                  <strong>1.</strong> Abra o WhatsApp no seu celular
                </li>
                <li className="text-sm text-gray-700">
                  <strong>2.</strong> Vá em WhatsApp Web ou Aplicativos Conectados
                </li>
                <li className="text-sm text-gray-700">
                  <strong>3.</strong> Escaneie o código QR abaixo
                </li>
                <li className="text-sm text-gray-700">
                  <strong>4.</strong> Confirme e aguarde a conexão
                </li>
              </ol>

              <button
                onClick={copyQRText}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Copy size={16} />
                Copiar QR Code
              </button>

              <p className="text-sm text-gray-500 mt-6">
                O código QR é renovado automaticamente a cada 30 segundos
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}

function QRCodeCanvas({ qr }: { qr: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !qr) return;

    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(canvasRef.current, qr, { width: 200 }, (err: any) => {
        if (err) console.error(err);
      });
    });
  }, [qr]);

  return (
    <div className="inline-block mb-6">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
