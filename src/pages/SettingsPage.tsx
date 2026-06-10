import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/DashboardLayout";
import { useAppState } from "../components/AppProvider";
import {
  Building2, Phone, Lock, Bell, Crown, CheckCircle, Save, Eye, EyeOff
} from "lucide-react";
import toast from "react-hot-toast";

const buyerSegments = ["mercado", "padaria", "restaurante", "petshop", "farmácia", "laboratório", "construção", "outro"];
const supplierTypes = ["fabricante", "distribuidor", "representante", "atacadista"] as const;

const TABS_SUPPLIER = [
  { id: "profile", label: "Dados da empresa", icon: Building2 },
  { id: "contact", label: "Contato", icon: Phone },
  { id: "security", label: "Segurança", icon: Lock },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "plan", label: "Plano", icon: Crown },
] as const;

const TABS_BUYER = [
  { id: "profile", label: "Dados da empresa", icon: Building2 },
  { id: "contact", label: "Contato", icon: Phone },
  { id: "security", label: "Segurança", icon: Lock },
  { id: "notifications", label: "Notificações", icon: Bell },
] as const;

type TabId = "profile" | "contact" | "security" | "notifications" | "plan";

function NotifRow({ label, desc, defaultOn = true }: { label: string; desc?: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${on ? "bg-orange-500" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { session, buyers, suppliers, updateSupplier } = useAppState();
  const [tab, setTab] = useState<TabId>("profile");
  const [showPw, setShowPw] = useState(false);

  if (!session) return <Navigate to="/auth" replace />;

  const role = session.role;
  const isBuyer = role === "buyer";
  const buyer = isBuyer ? buyers.find(b => b.id === session.id) : null;
  const supplier = !isBuyer ? suppliers.find(s => s.id === session.id) : null;
  const user = buyer || supplier;

  const tabs = isBuyer ? TABS_BUYER : TABS_SUPPLIER;

  const handleSaveProfile = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (!isBuyer && supplier) {
      updateSupplier(supplier.id, {
        companyName: String(data.get("companyName")),
        contactName: String(data.get("contactName")),
        city: String(data.get("city")),
        supplierType: String(data.get("supplierType")) as typeof supplierTypes[number],
        categories: String(data.get("categories")),
      });
    }
    toast.success("Alterações salvas com sucesso!");
  };

  return (
    <DashboardLayout role={role}>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie seus dados, segurança e preferências</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tabs */}
          <aside className="sm:w-48 flex-shrink-0">
            <nav className="flex sm:flex-col gap-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                    tab === id ? "bg-orange-50 text-orange-600 border-l-[3px] border-orange-500 pl-[9px]" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} className={tab === id ? "text-orange-500" : "text-gray-400"} />
                  <span className="hidden sm:block">{label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1">
            {tab === "profile" && (
              <div className="card p-6">
                <h2 className="font-bold text-gray-800 mb-5">Dados da empresa</h2>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-base">Nome da empresa</label>
                      <input name="companyName" defaultValue={user?.companyName} className="input-base w-full" />
                    </div>
                    <div>
                      <label className="label-base flex items-center gap-1.5">
                        CNPJ <Lock size={12} className="text-gray-400" />
                      </label>
                      <input value={user?.cnpj || ""} readOnly className="input-base w-full bg-gray-50 text-gray-500 cursor-not-allowed" title="Para alterar o CNPJ, entre em contato com o suporte" />
                    </div>
                    <div>
                      <label className="label-base">Responsável</label>
                      <input name="contactName" defaultValue={user?.contactName} className="input-base w-full" />
                    </div>
                    <div>
                      <label className="label-base">Cidade</label>
                      <input name="city" defaultValue={user?.city} className="input-base w-full" />
                    </div>
                    {!isBuyer && supplier && (
                      <div>
                        <label className="label-base">Tipo de fornecedor</label>
                        <select name="supplierType" defaultValue={supplier.supplierType} className="input-base w-full">
                          {supplierTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}
                    {!isBuyer && supplier && (
                      <div>
                        <label className="label-base">Categorias atendidas</label>
                        <input name="categories" defaultValue={supplier.categories} placeholder="alimentos, bebidas..." className="input-base w-full" />
                      </div>
                    )}
                    {isBuyer && buyer && (
                      <div>
                        <label className="label-base">Segmento</label>
                        <select name="segment" defaultValue={buyer.segment} className="input-base w-full">
                          {buyerSegments.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-gray-100">
                    <button type="submit" className="btn-primary">
                      <Save size={14} /> Salvar alterações
                    </button>
                  </div>
                </form>
              </div>
            )}

            {tab === "contact" && (
              <div className="card p-6">
                <h2 className="font-bold text-gray-800 mb-5">Informações de contato</h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-base">WhatsApp</label>
                      <input defaultValue={user?.whatsapp} placeholder="(XX) XXXXX-XXXX" className="input-base w-full" />
                    </div>
                    <div>
                      <label className="label-base">E-mail</label>
                      <input type="email" defaultValue={user?.email} className="input-base w-full" />
                    </div>
                    <div>
                      <label className="label-base">Instagram (opcional)</label>
                      <input placeholder="@seuinstagram" className="input-base w-full" />
                    </div>
                    <div>
                      <label className="label-base">LinkedIn (opcional)</label>
                      <input placeholder="linkedin.com/in/..." className="input-base w-full" />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <button className="btn-primary" onClick={() => toast.success("Contato atualizado!")}>
                      <Save size={14} /> Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === "security" && (
              <div className="card p-6">
                <h2 className="font-bold text-gray-800 mb-5">Segurança</h2>
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700">Alterar senha</h3>
                    <div className="grid gap-3 max-w-sm">
                      <div>
                        <label className="label-base">Senha atual</label>
                        <div className="relative">
                          <input type={showPw ? "text" : "password"} placeholder="••••••" className="input-base w-full pr-10" />
                          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="label-base">Nova senha</label>
                        <input type="password" placeholder="••••••" minLength={6} className="input-base w-full" />
                      </div>
                      <div>
                        <label className="label-base">Confirmar nova senha</label>
                        <input type="password" placeholder="••••••" className="input-base w-full" />
                      </div>
                      <button className="btn-primary" onClick={() => toast.success("Senha alterada com sucesso!")}>
                        <Save size={14} /> Alterar senha
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Autenticação em dois fatores</h3>
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                      <p className="text-sm text-gray-600">2FA via SMS ou Authenticator</p>
                      <span className="text-xs bg-gray-200 text-gray-500 font-medium px-2 py-0.5 rounded-full">Em breve</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "notifications" && (
              <div className="card p-6">
                <h2 className="font-bold text-gray-800 mb-5">Notificações</h2>
                <div>
                  <NotifRow label="Nova reserva na minha oferta" desc="Quando um comprador reservar na sua oferta" />
                  <NotifRow label="Meta atingida" desc="Quando sua oferta atingir o volume mínimo" />
                  <NotifRow label="Oferta aprovada/reprovada" desc="Quando o admin revisar sua oferta" />
                  <NotifRow label="Mensagem do admin" desc="Comunicações importantes da equipe Zuppi" />
                  <NotifRow label="Novidades da Zuppi" desc="Atualizações e novas funcionalidades" defaultOn={false} />
                </div>
                <div className="pt-4">
                  <button className="btn-primary" onClick={() => toast.success("Preferências salvas!")}>
                    <Save size={14} /> Salvar preferências
                  </button>
                </div>
              </div>
            )}

            {tab === "plan" && !isBuyer && supplier && (
              <div className="card p-6">
                <h2 className="font-bold text-gray-800 mb-5">Plano atual</h2>
                <div className={`rounded-2xl p-5 border-2 mb-5 ${supplier.planoFornecedor === "assinante" ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-gray-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Crown size={20} className={supplier.planoFornecedor === "assinante" ? "text-amber-500" : "text-gray-400"} />
                    <span className="font-bold text-lg capitalize">{supplier.planoFornecedor === "assinante" ? "Plano Pro" : "Plano Gratuito"}</span>
                    {supplier.planoFornecedor === "assinante" && (
                      <span className="text-xs bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full">Ativo</span>
                    )}
                  </div>
                  <ul className="space-y-1.5 mt-3">
                    {(supplier.planoFornecedor === "assinante"
                      ? ["Ofertas ilimitadas", "Dados completos dos compradores", "Exportar PDF e CSV", "IA de precificação", "Suporte prioritário"]
                      : ["1 oferta ativa por vez", "Dados resumidos de compradores", "Suporte por e-mail"]
                    ).map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle size={14} className="text-green-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                {supplier.planoFornecedor !== "assinante" && (
                  <button className="btn-primary" onClick={() => toast.success("Redirecionando para o checkout...")}>
                    <Crown size={14} /> Fazer upgrade para Pro — R$ 197/mês
                  </button>
                )}
                {supplier.planoFornecedor === "assinante" && (
                  <div className="space-y-2">
                    <div className="card p-3 text-sm text-gray-600">
                      <p className="font-medium">Próxima cobrança</p>
                      <p className="text-gray-400 text-xs">10/07/2026 · R$ 197,00</p>
                    </div>
                    <button className="btn-secondary text-sm" onClick={() => toast("Funcionalidade em breve")}>
                      Gerenciar assinatura
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
