import { useState } from "react";
import { Edit2, MessageSquare, Save, X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const DEFAULT_TEMPLATES = {
  buyer_signup: {
    title: "Bem-vindo Comprador",
    template: `Bem-vindo à Zup! 🎉\n\nVocê agora faz parte de nossa comunidade de compras coletivas.\n\nAcesse: zup.com.br/comprador\nEmail: suporte@zup.com.br\nWhatsApp: (41) 99727-4271\n\nAproveite as melhores ofertas! 🛍️`,
  },
  supplier_signup: {
    title: "Bem-vindo Fornecedor",
    template: `Bem-vindo à Zup! 🚀\n\nSua conta foi criada com sucesso!\n\n📱 Acesse: zup.com.br/fornecedor\n👤 Email: {email}\n🔑 Senha: {password}\n\nComece a criar suas ofertas agora!`,
  },
  buyer_immediate_purchase: {
    title: "Compra Imediata Realizada",
    template: `✅ Sua compra foi realizada!\n\n📦 {product}\n💰 {quantity} {unit} = R$ {amount}\n\nAcompanhe sua entrega no sistema!`,
  },
  buyer_collective_reserved: {
    title: "Reserva Coletiva Confirmada",
    template: `🎯 Sua reserva foi confirmada!\n\n📦 {product}\n💰 Valor: R$ {amount}\n\nProgresso: {progress}%`,
  },
};

export function WhatsAppSetupPage() {
  const [activeTab, setActiveTab] = useState<"status" | "templates">("status");
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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
    toast.success("Template salvo!");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">WhatsApp - Twilio</h1>

      {/* Abas */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("status")}
          className={`pb-4 px-2 font-medium ${
            activeTab === "status"
              ? "border-b-2 border-orange-500 text-orange-600"
              : "text-gray-600"
          }`}
        >
          📱 Status
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-4 px-2 font-medium ${
            activeTab === "templates"
              ? "border-b-2 border-orange-500 text-orange-600"
              : "text-gray-600"
          }`}
        >
          💬 Templates
        </button>
      </div>

      {/* Aba Status */}
      {activeTab === "status" && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle size={32} className="text-green-600" />
              <div>
                <p className="font-bold text-green-900">✅ Twilio Conectado</p>
                <p className="text-sm text-green-700">Número: +18777804236</p>
              </div>
            </div>
            <p className="text-sm text-green-800 mt-4">
              ✅ Mensagens automáticas estão ativas e funcionando
            </p>
          </div>
        </div>
      )}

      {/* Aba Templates */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          {Object.entries(templates).map(([key, template]) => (
            <div
              key={key}
              className="bg-white rounded-xl p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900">{template.title}</h3>
                {!editingKey || editingKey !== key ? (
                  <button
                    onClick={() => startEdit(key)}
                    className="text-orange-600 hover:text-orange-700 text-sm"
                  >
                    <Edit2 size={16} />
                  </button>
                ) : null}
              </div>

              {editingKey === key ? (
                <div className="space-y-2">
                  <textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveTemplate(key)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm"
                    >
                      <Save size={14} /> Salvar
                    </button>
                    <button
                      onClick={() => setEditingKey(null)}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {template.template}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
