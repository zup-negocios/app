import { useState, useEffect } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { Save, Edit2, MessageSquare, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  getTwilioConfig,
  saveTwilioConfig,
  testTwilioConnection,
} from "../utils/twilioConfig";

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
    title: "Venda Imediata",
    description: "Enviado ao fornecedor quando uma venda imediata acontece",
    template: `🔥 VENDA IMEDIATA! 🔥

PARABÉNS! Você acaba de vender!

📦 {product}
💰 {quantity} {unit} = R$ {amount}
⏱️ Agora: {time}
👤 Cliente: {buyer}

Relatório completo no sistema ➜ /fornecedor/minhas-vendas
Próximas vendas chegando! 🚀`,
  },
  collective_reservation: {
    title: "Nova Reserva Coletiva",
    description: "Enviado ao fornecedor quando uma reserva coletiva acontece",
    template: `🎉 Ótima notícia!
Mais uma reserva chegou na sua oferta!

📦 Oferta: {product}
📊 Progresso: {progress}% da meta ({current}/{target} {unit})
⏳ Prazo: até {deadline}

Bora chegar nessa meta! 💪`,
  },
  collective_meta_reached: {
    title: "Meta ou Data Limite Atingida",
    description: "Enviado ao fornecedor quando meta ou data limite é alcançada",
    template: `🚀 META ATINGIDA! 🚀

Sua oferta "{product}"
atingiu a meta!

📊 {total_quantity} {unit} reservados
💰 Total: R$ {total_amount}
👥 {buyer_count} comprador(es)

Detalhes dos clientes: veja no sistema
Próximo passo: Confirme entrega 📞`,
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

O fornecedor já recebeu seu pedido e entrará em contato em breve com detalhes de entrega!

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
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const config = getTwilioConfig();
    if (config.isConfigured) {
      setIsConfigured(true);
      setAccountSid(config.accountSid);
      setAuthToken(config.authToken);
      setPhoneNumber(config.phoneNumber);
    }
  }, []);

  const handleTestConnection = async () => {
    if (!accountSid || !authToken || !phoneNumber) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsTesting(true);
    try {
      const success = await testTwilioConnection();
      if (success) {
        saveTwilioConfig({
          accountSid,
          authToken,
          phoneNumber,
        });
        setIsConfigured(true);
        toast.success("✅ Twilio conectado com sucesso!");
      } else {
        toast.error("❌ Credenciais inválidas");
      }
    } catch (error) {
      toast.error("Erro ao testar conexão");
    } finally {
      setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
    saveTwilioConfig({
      accountSid: "",
      authToken: "",
      phoneNumber: "",
    });
    setIsConfigured(false);
    setAccountSid("");
    setAuthToken("");
    setPhoneNumber("");
    toast.success("Twilio desconectado");
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
    <DashboardLayout role="admin">
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
              Conectar WhatsApp
            </h2>

            {isConfigured ? (
              <div className="space-y-6">
                <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Check size={32} className="text-green-600" />
                    <div>
                      <p className="font-bold text-green-900">
                        ✅ Twilio Conectado
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Número WhatsApp: +55 {phoneNumber}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-green-800 mb-4">
                    As mensagens automáticas serão enviadas para este número de
                    WhatsApp quando:
                  </p>

                  <ul className="text-sm text-green-800 space-y-2 ml-4">
                    <li>✅ Um novo cliente se cadastra</li>
                    <li>✅ Um novo fornecedor se cadastra</li>
                    <li>✅ Uma venda imediata acontece</li>
                    <li>✅ Uma reserva coletiva é feita</li>
                    <li>✅ Uma compra coletiva é finalizada</li>
                    <li>✅ Solicitações de suporte chegam</li>
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
                    🔑 Configurar Twilio WhatsApp
                  </h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Insira suas credenciais Twilio para enviar mensagens automáticas via WhatsApp.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account SID
                      </label>
                      <input
                        type="password"
                        value={accountSid}
                        onChange={(e) => setAccountSid(e.target.value)}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Auth Token
                      </label>
                      <input
                        type="password"
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        placeholder="your_auth_token_here"
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número WhatsApp Twilio
                      </label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="whatsapp:+5541999999999"
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formato: whatsapp:+XXYYYYYYYYYY
                      </p>
                    </div>

                    <button
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={18} />
                      {isTesting ? "Testando..." : "Conectar Twilio"}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <p className="text-sm text-yellow-900 font-medium">Onde encontrar as credenciais:</p>
                  <ol className="text-xs text-yellow-800 mt-2 space-y-1 ml-4">
                    <li>1. Acesse <a href="https://console.twilio.com" target="_blank" rel="noopener" className="text-orange-600 font-bold">console.twilio.com</a></li>
                    <li>2. Account SID está no Dashboard</li>
                    <li>3. Auth Token está em Account → API Keys</li>
                    <li>4. Número WhatsApp está em WhatsApp Sandbox</li>
                  </ol>
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
                Customize as mensagens que serão enviadas automaticamente
              </p>

              {editingKey ? (
                // Modo edição
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

                  <div className="p-3 bg-yellow-50 rounded-lg text-xs text-yellow-800">
                    💡 Use variáveis entre chaves: {"{product}"}, {"{amount}"},
                    {"{buyer}"}, {"{email}"}, {"{password}"}, etc.
                  </div>
                </div>
              ) : (
                // Modo visualização
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
    </DashboardLayout>
  );
}
