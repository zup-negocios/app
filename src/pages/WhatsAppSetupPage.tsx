import { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Send, Check } from "lucide-react";
import toast from "react-hot-toast";

export function WhatsAppSetupPage() {
  const [phone, setPhone] = useState("41995127540");
  const [testMessage, setTestMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sendTestMessage = async () => {
    if (!phone || !testMessage) {
      toast.error("Preencha telefone e mensagem");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ""),
          message: testMessage,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("✅ Mensagem enviada!");
        setMessages([
          ...messages,
          {
            id: data.messageId,
            to: phone,
            message: testMessage,
            timestamp: new Date().toLocaleTimeString("pt-BR"),
          },
        ]);
        setTestMessage("");
      } else {
        toast.error("Erro ao enviar mensagem");
      }
    } catch (error) {
      toast.error("Erro na conexão");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendCollectiveTestMessage = () => {
    const msg = `🎉 Ótima notícia!
Mais uma reserva chegou na sua oferta!

📦 Oferta: Arroz Integral Premium
📊 Progresso: 65% da meta (325/500 kg)
⏳ Prazo: até 30 de junho

Bora chegar nessa meta! 💪`;
    setTestMessage(msg);
  };

  const sendMetaTestMessage = () => {
    const msg = `🚀 META ATINGIDA! 🚀

Sua oferta "Arroz Integral Premium"
atingiu a meta!

📊 500 kg reservados
💰 Total: R$ 2.500,00
👥 8 comprador(es)

Detalhes dos clientes: veja no sistema
Próximo passo: Confirme entrega 📞`;
    setTestMessage(msg);
  };

  const sendImmediateTestMessage = () => {
    const msg = `🔥 VENDA IMEDIATA! 🔥

PARABÉNS! Você acaba de vender!

📦 Arroz Integral Premium
💰 50 kg = R$ 250,00
⏱️ Agora: 15:30
👤 Cliente: Supermercado XYZ

Relatório completo no sistema ➜ /fornecedor/minhas-vendas

Próximas vendas chegando! 🚀`;
    setTestMessage(msg);
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Teste WhatsApp</h1>
          <p className="text-gray-600 mt-2">
            Teste o sistema de notificações automáticas
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Formulário de teste */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h2 className="font-bold text-gray-900 mb-4">📱 Enviar Mensagem de Teste</h2>

              {/* Campo de telefone */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="41995127540"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use formato: 41995127540 (DDD + número)
                </p>
              </div>

              {/* Campo de mensagem */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={6}
                  placeholder="Digite a mensagem a enviar..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-sm"
                />
              </div>

              {/* Botão enviar */}
              <button
                onClick={sendTestMessage}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send size={16} />
                {loading ? "Enviando..." : "Enviar Mensagem"}
              </button>
            </div>

            {/* Templates de teste */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">📋 Templates de Teste</h3>
              <div className="space-y-2">
                <button
                  onClick={sendCollectiveTestMessage}
                  className="w-full text-left px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  <p className="font-medium text-orange-900">📦 Nova Reserva Coletiva</p>
                  <p className="text-xs text-orange-700">Teste notificação de nova reserva</p>
                </button>

                <button
                  onClick={sendMetaTestMessage}
                  className="w-full text-left px-4 py-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <p className="font-medium text-green-900">🚀 Meta Atingida</p>
                  <p className="text-xs text-green-700">Teste notificação de meta alcançada</p>
                </button>

                <button
                  onClick={sendImmediateTestMessage}
                  className="w-full text-left px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <p className="font-medium text-blue-900">⚡ Venda Imediata</p>
                  <p className="text-xs text-blue-700">Teste notificação de venda imediata</p>
                </button>
              </div>
            </div>
          </div>

          {/* Histórico de mensagens */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 h-fit">
            <h3 className="font-bold text-gray-900 mb-4">📤 Histórico Enviado</h3>

            {messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Nenhuma mensagem enviada</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-gray-50 rounded-lg p-3 text-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-gray-600">{msg.to}</span>
                      <span className="text-gray-400">{msg.timestamp}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap break-words">
                      {msg.message.substring(0, 100)}...
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-green-600">
                      <Check size={12} />
                      <span className="text-xs">Registrada</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <p>✅ {messages.length} mensagem(ns) enviada(s)</p>
            </div>
          </div>
        </div>

        {/* Informações de funcionamento */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-3">ℹ️ Como funciona</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✅ Mensagens são automaticamente enviadas quando:</li>
            <li className="ml-4">• Nova reserva coletiva é feita → fornecedor notificado</li>
            <li className="ml-4">• Meta de compra é atingida → aviso especial</li>
            <li className="ml-4">• Venda imediata é realizada → notificação entusiasta</li>
            <li className="mt-3">📊 Cada mensagem é registrada em tempo real</li>
            <li>💾 O histórico fica armazenado no servidor</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
