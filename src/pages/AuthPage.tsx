import { FormEvent, useState } from "react";
import { ArrowLeft, Building2, ChartNoAxesCombined, Factory, FileText, PackageCheck } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { LoginChoice } from "../components/LoginChoice";
import { useAppState } from "../components/AppProvider";

const buyerSegments = ["mercado", "padaria", "restaurante", "petshop", "farmacia", "laboratorio", "construcao", "outro"];

export function AuthPage() {
  const [params] = useSearchParams();
  const type = params.get("type");
  const { session, addBuyer, addSupplier, login } = useAppState();
  const navigate = useNavigate();

  const [buyerEmail, setBuyerEmail] = useState("joao@bompreco.com");
  const [buyerPassword, setBuyerPassword] = useState("123456");
  const [supplierEmail, setSupplierEmail] = useState("ana@moinhobrasil.com");
  const [supplierPassword, setSupplierPassword] = useState("123456");
  const [loginError, setLoginError] = useState("");

  if (session) return <Navigate to={session.role === "buyer" ? "/comprador" : "/fornecedor"} replace />;

  const handleBuyerRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const created = addBuyer({
      companyName: String(data.get("companyName")),
      cnpj: String(data.get("cnpj")),
      contactName: String(data.get("contactName")),
      whatsapp: String(data.get("whatsapp")),
      email: String(data.get("email")),
      password: String(data.get("password")),
      city: String(data.get("city")),
      segment: String(data.get("segment")),
    });
    navigate(`/auth?type=buyer&email=${encodeURIComponent(created.email)}`);
  };

  const handleSupplierRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const created = addSupplier({
      companyName: String(data.get("companyName")),
      cnpj: String(data.get("cnpj")),
      contactName: String(data.get("contactName")),
      whatsapp: String(data.get("whatsapp")),
      email: String(data.get("email")),
      password: String(data.get("password")),
      city: String(data.get("city")),
      categories: String(data.get("categories")),
      supplierType: String(data.get("supplierType")) as "fabricante" | "distribuidor" | "representante" | "atacadista",
      planoFornecedor: String(data.get("planoFornecedor")) as "gratuito" | "assinante",
    });
    navigate(`/auth?type=supplier&email=${encodeURIComponent(created.email)}`);
  };

  if (!type) return <main className="max-w-6xl mx-auto px-4 py-10"><LoginChoice /></main>;

  if (type === "buyer") {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600"><ArrowLeft size={16} /> trocar tipo de acesso</Link>
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-4">
          <section className="bg-orange-50 border border-orange-200 rounded-2xl p-6 space-y-5">
            <img src="/assets/zuppi-logo-light.png" alt="Zuppi logo" className="h-12 w-auto" />
            <div>
              <p className="text-sm font-semibold text-orange-700 uppercase">Area do comprador</p>
              <h1 className="text-3xl font-bold">Entrar para comprar melhor em grupo</h1>
              <p className="text-gray-700 mt-2">Use este acesso para ver ofertas ativas, reservar quantidades, acompanhar metas e consultar seus pedidos.</p>
            </div>
            <div className="grid gap-3 text-sm">
              <p className="flex gap-2"><Building2 className="text-orange-600 shrink-0" size={18} /> Dashboard com ofertas abertas e categorias</p>
              <p className="flex gap-2"><PackageCheck className="text-orange-600 shrink-0" size={18} /> Validacao de compra minima por oferta</p>
              <p className="flex gap-2"><FileText className="text-orange-600 shrink-0" size={18} /> Meus pedidos e valores totais</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-sm border border-orange-100">
              Demo comprador: <b>joao@bompreco.com</b> / <b>123456</b>
            </div>
          </section>

          <section className="grid gap-4">
            <div className="card p-6 space-y-3">
              <h2 className="text-xl font-bold">Login comprador</h2>
              <input className="w-full border rounded-lg p-2" placeholder="E-mail" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
              <input type="password" className="w-full border rounded-lg p-2" placeholder="Senha" value={buyerPassword} onChange={(e) => setBuyerPassword(e.target.value)} />
              {loginError && <p className="text-sm text-red-600">{loginError}</p>}
              <button
                className="btn-primary w-full"
                onClick={() => {
                  const result = login("buyer", buyerEmail, buyerPassword);
                  if (!result.ok) return setLoginError(result.message || "Falha no login");
                  navigate("/comprador");
                }}
              >
                Entrar no painel comprador
              </button>
            </div>

            <form onSubmit={handleBuyerRegister} className="card p-6 grid sm:grid-cols-2 gap-3">
              <h2 className="sm:col-span-2 font-bold text-xl">Cadastrar comprador</h2>
              <input required name="companyName" placeholder="Nome da empresa compradora" className="border rounded-lg p-2" />
              <input required name="cnpj" placeholder="CNPJ" className="border rounded-lg p-2" />
              <input required name="contactName" placeholder="Responsavel pelas compras" className="border rounded-lg p-2" />
              <input required name="whatsapp" placeholder="WhatsApp" className="border rounded-lg p-2" />
              <input required type="email" name="email" placeholder="E-mail" className="border rounded-lg p-2" />
              <input required type="password" name="password" minLength={6} placeholder="Senha" className="border rounded-lg p-2" />
              <input required name="city" placeholder="Cidade" className="border rounded-lg p-2" />
              <select required name="segment" className="border rounded-lg p-2">{buyerSegments.map((segment) => <option key={segment}>{segment}</option>)}</select>
              <button className="btn-secondary sm:col-span-2">Cadastrar comprador</button>
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <Link to="/auth" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600"><ArrowLeft size={16} /> trocar tipo de acesso</Link>
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-4">
        <section className="bg-gray-950 text-white rounded-2xl p-6 space-y-5">
          <img src="/assets/zuppi-logo-dark.png" alt="Zuppi logo" className="h-12 w-auto" />
          <div>
            <p className="text-sm font-semibold text-orange-400 uppercase">Area do fornecedor</p>
            <h1 className="text-3xl font-bold">Entrar para vender por volume</h1>
            <p className="text-gray-300 mt-2">Use este acesso para criar ofertas, acompanhar metas, ver pedidos e gerar relatorios de compradores interessados.</p>
          </div>
          <div className="grid gap-3 text-sm text-gray-200">
            <p className="flex gap-2"><Factory className="text-orange-400 shrink-0" size={18} /> Cadastro de ofertas com meta e prazo</p>
            <p className="flex gap-2"><ChartNoAxesCombined className="text-orange-400 shrink-0" size={18} /> Dashboard de demanda reservada</p>
            <p className="flex gap-2"><FileText className="text-orange-400 shrink-0" size={18} /> Relatorio completo para assinantes</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-sm border border-white/10">
            Demo fornecedor: <b>ana@moinhobrasil.com</b> / <b>123456</b>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="card p-6 space-y-3">
            <h2 className="text-xl font-bold">Login fornecedor</h2>
            <input className="w-full border rounded-lg p-2" placeholder="E-mail" value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} />
            <input type="password" className="w-full border rounded-lg p-2" placeholder="Senha" value={supplierPassword} onChange={(e) => setSupplierPassword(e.target.value)} />
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button
              className="btn-primary w-full"
              onClick={() => {
                const result = login("supplier", supplierEmail, supplierPassword);
                if (!result.ok) return setLoginError(result.message || "Falha no login");
                navigate("/fornecedor");
              }}
            >
              Entrar no painel fornecedor
            </button>
          </div>

          <form onSubmit={handleSupplierRegister} className="card p-6 grid sm:grid-cols-2 gap-3">
            <h2 className="sm:col-span-2 font-bold text-xl">Cadastrar fornecedor</h2>
            <input required name="companyName" placeholder="Nome da empresa fornecedora" className="border rounded-lg p-2" />
            <input required name="cnpj" placeholder="CNPJ" className="border rounded-lg p-2" />
            <input required name="contactName" placeholder="Responsavel comercial" className="border rounded-lg p-2" />
            <input required name="whatsapp" placeholder="WhatsApp comercial" className="border rounded-lg p-2" />
            <input required type="email" name="email" placeholder="E-mail" className="border rounded-lg p-2" />
            <input required type="password" name="password" minLength={6} placeholder="Senha" className="border rounded-lg p-2" />
            <input required name="city" placeholder="Cidade base" className="border rounded-lg p-2" />
            <input required name="categories" placeholder="Categorias atendidas" className="border rounded-lg p-2" />
            <select required name="supplierType" className="border rounded-lg p-2">
              <option value="fabricante">fabricante</option>
              <option value="distribuidor">distribuidor</option>
              <option value="representante">representante</option>
              <option value="atacadista">atacadista</option>
            </select>
            <select required name="planoFornecedor" className="border rounded-lg p-2">
              <option value="gratuito">plano gratuito</option>
              <option value="assinante">assinante Zuppi</option>
            </select>
            <button className="btn-secondary sm:col-span-2">Cadastrar fornecedor</button>
          </form>
        </section>
      </div>
    </main>
  );
}
