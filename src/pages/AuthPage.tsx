import { FormEvent, useState } from "react";
import { ArrowLeft, Building2, ChartNoAxesCombined, Factory, FileText, PackageCheck } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { LoginChoice } from "../components/LoginChoice";
import { useAppState } from "../components/AppProvider";

const buyerSegments = ["mercado", "padaria", "restaurante", "petshop", "farmacia", "laboratorio", "construcao", "outro"];

export function AuthPage() {
  const [params] = useSearchParams();
  const type = params.get("type");
  const { session, buyers, suppliers, addBuyer, addSupplier, login } = useAppState();
  const navigate = useNavigate();

  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPassword, setBuyerPassword] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierPassword, setSupplierPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  if (session) return <Navigate to={session.role === "buyer" ? "/comprador" : "/fornecedor"} replace />;

  const handleBuyerRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim().toLowerCase();
    const password = String(data.get("password"));

    if (buyers.some(b => b.email.trim().toLowerCase() === email)) {
      setRegisterError("Este e-mail já está cadastrado. Faça login.");
      return;
    }

    const created = addBuyer({
      companyName: String(data.get("companyName")),
      cnpj: String(data.get("cnpj")),
      contactName: String(data.get("contactName")),
      whatsapp: String(data.get("whatsapp")),
      email,
      password,
      city: String(data.get("city")),
      segment: String(data.get("segment")),
    });

    // Auto-login após cadastro
    const result = login("buyer", created.email, password);
    if (result.ok) {
      navigate("/comprador");
    } else {
      setRegisterSuccess("Cadastro realizado! Faça login para continuar.");
      setBuyerEmail(email);
    }
  };

  const handleSupplierRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterSuccess("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim().toLowerCase();
    const password = String(data.get("password"));

    if (suppliers.some(s => s.email.trim().toLowerCase() === email)) {
      setRegisterError("Este e-mail já está cadastrado. Faça login.");
      return;
    }

    const created = addSupplier({
      companyName: String(data.get("companyName")),
      cnpj: String(data.get("cnpj")),
      contactName: String(data.get("contactName")),
      whatsapp: String(data.get("whatsapp")),
      email,
      password,
      city: String(data.get("city")),
      categories: String(data.get("categories")),
      supplierType: String(data.get("supplierType")) as "fabricante" | "distribuidor" | "representante" | "atacadista",
      planoFornecedor: String(data.get("planoFornecedor")) as "gratuito" | "assinante",
    });

    // Auto-login após cadastro
    const result = login("supplier", created.email, password);
    if (result.ok) {
      navigate("/fornecedor");
    } else {
      setRegisterSuccess("Cadastro realizado! Faça login para continuar.");
      setSupplierEmail(email);
    }
  };

  if (!type) return <main className="max-w-6xl mx-auto px-4 py-10"><LoginChoice /></main>;

  if (type === "buyer") {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600">
          <ArrowLeft size={16} /> trocar tipo de acesso
        </Link>
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-4">

          {/* Painel esquerdo */}
          <section className="bg-orange-50 border border-orange-200 rounded-2xl p-6 space-y-5">
            <img src="/assets/zuppi-logo-light.png" alt="Zuppi logo" className="h-12 w-auto" />
            <div>
              <p className="text-sm font-semibold text-orange-700 uppercase">Área do comprador</p>
              <h1 className="text-3xl font-bold">Compre mais, pague menos</h1>
              <p className="text-gray-700 mt-2">Acesse ofertas com compra imediata ou participe de coletivas para desbloquear preços melhores.</p>
            </div>
            <div className="grid gap-3 text-sm">
              <p className="flex gap-2"><Building2 className="text-orange-600 shrink-0" size={18} /> Compra individual e compra coletiva</p>
              <p className="flex gap-2"><PackageCheck className="text-orange-600 shrink-0" size={18} /> Preços progressivos conforme a meta</p>
              <p className="flex gap-2"><FileText className="text-orange-600 shrink-0" size={18} /> Histórico de pedidos e compras</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-sm border border-orange-100 text-gray-500">
              Demo: <b>joao@bompreco.com</b> / <b>123456</b>
            </div>
          </section>

          {/* Formulários */}
          <section className="grid gap-4">

            {/* Login */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 shadow-sm">
              <h2 className="text-xl font-bold">Entrar</h2>
              <input
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300"
                placeholder="E-mail"
                type="email"
                value={buyerEmail}
                onChange={e => { setBuyerEmail(e.target.value); setLoginError(""); }}
              />
              <input
                type="password"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300"
                placeholder="Senha"
                value={buyerPassword}
                onChange={e => { setBuyerPassword(e.target.value); setLoginError(""); }}
              />
              {loginError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{loginError}</p>}
              <button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
                onClick={() => {
                  setLoginError("");
                  const result = login("buyer", buyerEmail, buyerPassword);
                  if (!result.ok) return setLoginError(result.message || "E-mail ou senha inválidos.");
                  navigate("/comprador");
                }}
              >
                Entrar como comprador
              </button>
            </div>

            {/* Cadastro */}
            <form onSubmit={handleBuyerRegister} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-xl mb-4">Criar conta</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <input required name="companyName" placeholder="Nome da empresa" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
                <input required name="cnpj" placeholder="CNPJ" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
                <input required name="contactName" placeholder="Responsável pelas compras" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
                <input required name="whatsapp" placeholder="WhatsApp" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
                <input required type="email" name="email" placeholder="E-mail" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
                <input required type="password" name="password" minLength={6} placeholder="Senha (mín. 6 caracteres)" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
                <input required name="city" placeholder="Cidade" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
                <select required name="segment" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300 bg-white">
                  <option value="">Segmento da empresa</option>
                  {buyerSegments.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              {registerError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">{registerError}</p>}
              {registerSuccess && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mt-3">{registerSuccess}</p>}
              <button className="mt-4 w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold py-3 rounded-xl transition-colors">
                Criar minha conta
              </button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600">
        <ArrowLeft size={16} /> trocar tipo de acesso
      </Link>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-4">

        {/* Painel esquerdo */}
        <section className="bg-gray-950 text-white rounded-2xl p-6 space-y-5">
          <img src="/assets/zuppi-logo-dark.png" alt="Zuppi logo" className="h-12 w-auto" />
          <div>
            <p className="text-sm font-semibold text-orange-400 uppercase">Área do fornecedor</p>
            <h1 className="text-3xl font-bold">Venda mais, com mais previsibilidade</h1>
            <p className="text-gray-300 mt-2">Crie ofertas, defina metas coletivas e acompanhe o interesse dos compradores em tempo real.</p>
          </div>
          <div className="grid gap-3 text-sm text-gray-200">
            <p className="flex gap-2"><Factory className="text-orange-400 shrink-0" size={18} /> Cadastro de ofertas Market e Coletiva</p>
            <p className="flex gap-2"><ChartNoAxesCombined className="text-orange-400 shrink-0" size={18} /> Dashboard com meta e demanda reservada</p>
            <p className="flex gap-2"><FileText className="text-orange-400 shrink-0" size={18} /> Relatórios e gestão de pedidos</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-sm border border-white/10 text-gray-300">
            Demo: <b>ana@moinhobrasil.com</b> / <b>123456</b>
          </div>
        </section>

        {/* Formulários */}
        <section className="grid gap-4">

          {/* Login */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3 shadow-sm">
            <h2 className="text-xl font-bold">Entrar</h2>
            <input
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300"
              placeholder="E-mail"
              type="email"
              value={supplierEmail}
              onChange={e => { setSupplierEmail(e.target.value); setLoginError(""); }}
            />
            <input
              type="password"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300"
              placeholder="Senha"
              value={supplierPassword}
              onChange={e => { setSupplierPassword(e.target.value); setLoginError(""); }}
            />
            {loginError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{loginError}</p>}
            <button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
              onClick={() => {
                setLoginError("");
                const result = login("supplier", supplierEmail, supplierPassword);
                if (!result.ok) return setLoginError(result.message || "E-mail ou senha inválidos.");
                navigate("/fornecedor");
              }}
            >
              Entrar como fornecedor
            </button>
          </div>

          {/* Cadastro */}
          <form onSubmit={handleSupplierRegister} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-xl mb-4">Criar conta de fornecedor</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input required name="companyName" placeholder="Nome da empresa" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
              <input required name="cnpj" placeholder="CNPJ" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
              <input required name="contactName" placeholder="Responsável comercial" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
              <input required name="whatsapp" placeholder="WhatsApp comercial" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
              <input required type="email" name="email" placeholder="E-mail" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
              <input required type="password" name="password" minLength={6} placeholder="Senha (mín. 6 caracteres)" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
              <input required name="city" placeholder="Cidade base" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
              <input required name="categories" placeholder="Categorias (ex: Alimentos, Bebidas)" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300" />
              <select required name="supplierType" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300 bg-white">
                <option value="">Tipo de fornecedor</option>
                <option value="fabricante">Fabricante</option>
                <option value="distribuidor">Distribuidor</option>
                <option value="representante">Representante</option>
                <option value="atacadista">Atacadista</option>
              </select>
              <select required name="planoFornecedor" className="border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-300 bg-white">
                <option value="gratuito">Plano gratuito</option>
                <option value="assinante">Assinante Zuppi</option>
              </select>
            </div>
            {registerError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-3">{registerError}</p>}
            {registerSuccess && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mt-3">{registerSuccess}</p>}
            <button className="mt-4 w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold py-3 rounded-xl transition-colors">
              Criar conta de fornecedor
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
