import { useState, useEffect } from "react";
import { Save, Edit2, MessageSquare, Check, X, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  getEvolutionConfig,
  createEvolutionInstance,
  disconnectEvolution,
} from "../utils/evolutionConfig";

const DEFAULT_TEMPLATES = {
  buyer_signup: {
    title: "Bem-vindo Comprador",
    description: "Enviado ao se cadastrar como consumidor",
    template: `Bem-vindo à Zup! 🎉

Você agora faz parte de nossa comunidade de compras coletivas.

Acesse: zup.com.br/comprador
Email: suporte@zup.com.br
WhatsApp: (41) 99727-4271

Aproveite as melhores ofertas! 🛍️`,
  },
  supplier_signup: {
    title: "Bem-vindo Fornecedor",
    description: "Enviado ao se cadastrar como fornecedor com dados de acesso",
    template: `Bem-vindo à Zup! 🚀

Sua conta foi criada com sucesso!

📱 Acesse: zup.com.br/fornecedor
👤 Email: {email}
🔑 Senha: {password}

Comece a criar suas ofertas agora!
Suporte: gestao.zup@gmail.com`,
  },
  immediate_sale: {
    title: "Venda Imediata (Fornecedor)",
    description: "Enviado ao fornecedor quando uma venda imediata acontece",
    template: `🔥 VENDA IMEDIATA! 🔥

PARABÉNS! Você acaba de vender!

📦 {product}
💰 {quantity} {unit} = R$ {amount}
⏱️ Agora: {time}
👤 Cliente: {buyer}

Relatório completo no sistema
Próximas vendas chegando! 🚀`,
  },
  collective_reservation: {
    title: "Nova Reserva Coletiva (Fornecedor)",
    description: "Enviado ao fornecedor quando uma reserva coletiva acontece",
    template: `🎉 Ótima notícia!
Mais uma reserva chegou na sua oferta!

📦 Oferta: {product}
📊 Progresso: {progress}% da meta ({current}/{target} {unit})
⏳ Prazo: até {deadline}

Bora chegar nessa meta! 💪`,
  },
  buyer_immediate_purchase: {
    title: "Compra Imediata Realizada (Cliente)",
    description: "Enviado ao cliente quando realiza uma compra imediata",
    template: `✅ Sua compra foi realizada!

📦 {product}
💰 {quantity} {unit} = R$ {amount}
🏪 Fornecedor: {supplier}
📞 Contato: {supplier_phone}

Acompanhe sua entrega no sistema!
Obrigado por comprar com a Zup! 🙏`,
  },
  buyer_collective_reserved: {
    title: "Reserva Coletiva Confirmada (Cliente)",
    description: "Enviado ao cliente quando se inscreve em compra coletiva",
    template: `🎯 Sua reserva foi confirmada!

📦 {product}
🎁 {quantity} {unit}
💰 Valor: R$ {amount}

Você receberá atualizações sobre o progresso da compra.
Meta: {target_quantity} {unit}
Progresso: {progress}%

Fique ligado! 👀`,
  },
  buyer_collective_completed: {
    title: "Compra Coletiva Finalizada (Cliente)",
    description: "Enviado ao cliente quando compra coletiva é finalizada",
    template: `🎉 PARABÉNS! Sua compra coletiva foi finalizada!

📦 {product}
✅ Total negociado: {total_quantity} {unit}
💰 Valor total: R$ {total_amount}

O fornecedor já recebeu seu pedido!

Obrigado por fazer parte desta compra! 🙏`,
  },
  buyer_support: {
    title: "Resposta de Suporte (Cliente)",
    description: "Enviado ao cliente quando solicita suporte",
    template: `📞 Olá! Recebemos sua solicitação!

Nossa equipe já está analisando seu caso e em breve responderemos com a solução.

Tempo médio de resposta: 2-4 horas

Obrigado por sua paciência! 🙏`,
  },
  supplier_support: {
    title: "Resposta de Suporte (Fornecedor)",
    description: "Enviado ao fornecedor quando solicita suporte",
    template: `📞 Olá! Recebemos sua solicitação!

Nossa equipe já está analisando seu caso e em breve responderemos com a solução.

Tempo médio de resposta: 2-4 horas

Obrigado por sua paciência! 🙏`,
  },
};

export function WhatsAppSetupPage() {
  const [activeTab, setActiveTab] = useState<"connection" | "templates">(
    "connection"
  );
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const config = getEvolutionConfig();
    if (config.isConnected) {
      setIsConnected(true);
      setInstanceName(config.instanceName);
    }
  }, []);

  const handleGenerateQR = async () => {
    setIsLoading(true);
    try {
      const result = await createEvolutionInstance();
      if (result.success && result.qrCode) {
        setQrCode(result.qrCode);
        setInstanceName(result.instanceName);
        toast.success("✅ QR Code gerado! Escaneie com seu WhatsApp");
      } else {
        toast.error(result.message || "Erro ao gerar QR Code");
      }
    } catch (error) {
      toast.error("Erro ao gerar QR Code");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScanned = () => {
    setIsConnected(true);
    setQrCode(null);
    toast.success("✅ WhatsApp conectado com sucesso!");
  };

  const handleDisconnect = () => {
    disconnectEvolution();
    setIsConnected(false);
    setQrCode(null);
    setInstanceName("");
    toast.success("WhatsApp desconectado");
  };

  const startEdit = (key: string) => {
    setEditingKey(key);
    setEditValue(templates[key as keyof typeof templates].template);
  };

  const saveTemplate = (key: string) => {
    setTemplates({
      ...templates,
      [key]: {
        ...templates[key as keyof typeof templates],
        template: editValue,
      },
    });
    setEditingKey(null);
    toast.success("Template salvo com sucesso!");
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuração WhatsApp</h1>
        <p className="text-gray-600 mt-2">
          Conecte WhatsApp e gerencie templates de mensagens automáticas
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("connection")}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === "connection"
              ? "border-b-2 border-orange-500 text-orange-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          📱 Conexão
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-4 px-2 font-medium transition-colors ${
            activeTab === "templates"
              ? "border-b-2 border-orange-500 text-orange-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          💬 Templates
        </button>
      </div>

      {/* Aba: Conexão */}
      {activeTab === "connection" && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Conectar WhatsApp via Evolution API
          </h2>

          {isConnected ? (
            <div className="space-y-6">
              <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <Check size={32} className="text-green-600" />
                  <div>
                    <p className="font-bold text-green-900">
                      ✅ WhatsApp Conectado
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Instância: {instanceName}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-green-800 mb-4">
                  Todas as mensagens automáticas serão enviadas via WhatsApp:
                </p>

                <ul className="text-sm text-green-800 space-y-2 ml-4">
                  <li>✅ Boas-vindas para novos clientes</li>
                  <li>✅ Credenciais para novos fornecedores</li>
                  <li>✅ Confirmação de compras imediatas</li>
                  <li>✅ Atualizações de reservas coletivas</li>
                  <li>✅ Respostas de suporte</li>
                </ul>

                <button
                  onClick={handleDisconnect}
                  className="mt-6 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2"
                >
                  <X size={16} />
                  Desconectar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3">
                  🎯 Como conectar (3 passos)
                </h3>

                <ol className="text-sm text-blue-800 space-y-3 ml-4">
                  <li>
                    <strong>1. Clique em "Gerar QR Code"</strong> abaixo
                  </li>
                  <li>
                    <strong>2. Abra WhatsApp no seu celular</strong> e escaneie o código com a câmera
                  </li>
                  <li>
                    <strong>3. Confirme</strong> e o WhatsApp estará conectado
                  </li>
                </ol>
              </div>

              {qrCode ? (
                <div className="p-6 bg-white rounded-xl border-2 border-orange-200 space-y-4">
                  <div className="text-center">
                    <p className="font-bold text-gray-900 mb-4">
                      Escaneie este QR Code:
                    </p>
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-64 h-64 mx-auto border-4 border-orange-300 rounded-lg p-2"
                    />
                  </div>

                  <div className="space-y-2 text-center">
                    <p className="text-sm text-gray-600">
                      Aponte a câmera do seu celular para este código
                    </p>
                    <button
                      onClick={handleQRScanned}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg"
                    >
                      ✅ Já escaneei, conectar agora
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateQR}
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Gerando QR Code...
                    </>
                  ) : (
                    <>
                      <MessageSquare size={20} />
                      Gerar QR Code
                    </>
                  )}
                </button>
              )}

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-sm text-purple-900 font-medium">
                  🧪 Modo SIMULADOR (Teste)
                </p>
                <ul className="text-xs text-purple-800 mt-2 space-y-1">
                  <li>✅ QR Code visual para testes</li>
                  <li>✅ Mensagens são armazenadas no sistema</li>
                  <li>✅ Nenhuma dependência externa</li>
                  <li>✅ Pronto para testes completos</li>
                  <li>⚠️ Mensagens NÃO são enviadas para WhatsApp real</li>
                </ul>
                <p className="text-xs text-purple-700 mt-3 font-semibold">
                  💡 Depois: Configure Evolution API ou WhatsApp Business API para envios reais
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Aba: Templates */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Templates Automáticos
            </h2>
            <p className="text-gray-600 mb-6">
              Customize as mensagens que serão enviadas automaticamente quando eventos ocorrem
            </p>

            {editingKey ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => saveTemplate(editingKey)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingKey(null)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(templates).map(([key, template]) => (
                  <div
                    key={key}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-orange-200 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {template.title}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                          {template.description}
                        </p>
                      </div>
                      <button
                        onClick={() => startEdit(key)}
                        className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium text-sm"
                      >
                        <Edit2 size={14} />
                        Editar
                      </button>
                    </div>

                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                      {template.template}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
