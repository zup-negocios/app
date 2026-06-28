import { useAppState } from "../components/AppProvider";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { MessageCircle, Mail, Phone, ArrowRight } from "lucide-react";

export function SupportPage() {
  const { session, buyers, suppliers } = useAppState();

  if (!session) return <Navigate to="/auth" replace />;

  const isBuyer = session.role === "buyer";
  const user = isBuyer
    ? buyers.find(b => b.id === session.id)
    : suppliers.find(s => s.id === session.id);

  const userType = isBuyer ? "Comprador" : "Fornecedor";
  const userName = user?.companyName || "Usuário";
  const whatsappNumber = "5541997274271";
  const supportEmail = "gestao.zup@gmail.com";
  const whatsappMessage = `Olá! Sou ${userName} (${userType}) e gostaria de obter suporte.`;

  return (
    <DashboardLayout role={session.role}>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Suporte Zup</h1>
          <p className="text-gray-600 mt-2">Estamos aqui para ajudar você!</p>
        </div>

        {/* Info do Usuário */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              {userName.charAt(0)}
            </div>
            <div>
              <p className="text-sm text-gray-600">Acesso como:</p>
              <p className="font-bold text-lg text-gray-900">{userName} ({userType})</p>
            </div>
          </div>
        </div>

        {/* Opções de Contato */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Entre em contato conosco</h2>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-500 transition-colors">
                    <MessageCircle size={24} className="text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">WhatsApp</h3>
                    <p className="text-gray-600 text-sm mt-1">Chat instantâneo com nosso time</p>
                    <p className="font-semibold text-green-600 mt-2 flex items-center gap-1">
                      41 9727-4271
                    </p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-gray-400 group-hover:text-green-600 mt-1 transition-colors" />
              </div>
            </div>
          </a>

          {/* E-mail */}
          <a
            href={`mailto:${supportEmail}?subject=Suporte - ${userName} (${userType})&body=${encodeURIComponent(whatsappMessage)}`}
            className="block"
          >
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500 transition-colors">
                    <Mail size={24} className="text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">E-mail</h3>
                    <p className="text-gray-600 text-sm mt-1">Envie sua dúvida por e-mail</p>
                    <p className="font-semibold text-blue-600 mt-2">
                      {supportEmail}
                    </p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-gray-400 group-hover:text-blue-600 mt-1 transition-colors" />
              </div>
            </div>
          </a>

          {/* Telefone Info */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6 mt-8">
            <div className="flex items-start gap-3">
              <Phone size={24} className="text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-900">Tempo de resposta</h3>
                <p className="text-gray-700 text-sm mt-2">
                  Estamos disponíveis de segunda a sexta, das 9h às 18h. Sua mensagem será respondida dentro de 2 horas durante o horário comercial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
