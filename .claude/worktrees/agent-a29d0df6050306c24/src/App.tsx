import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./components/AppProvider";
import { Header } from "./components/Header";
import { MobileNav } from "./components/MobileNav";
import { InstallBanner } from "./components/InstallBanner";
import { AdminPage } from "./pages/AdminPage";
import { AuthPage } from "./pages/AuthPage";
import { BuyerDashboardPage } from "./pages/BuyerDashboardPage";
import { BuyerPurchaseDetailPage, BuyerPurchasesPage } from "./pages/BuyerPurchasesPage";
import { BuyerCollectivePage, BuyerMarketPage } from "./pages/BuyerOffersPage";
import { BuyerReportsPage } from "./pages/BuyerReportsPage";
import { GestaoPage } from "./pages/GestaoPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { OfferDetailPage } from "./pages/OfferDetailPage";
import { OffersPage } from "./pages/OffersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RatingsPage } from "./pages/RatingsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SupplierCreateOfferPage, SupplierDashboardPage, SupplierOfferDetailPage, SupplierPreOrdersPage } from "./pages/SupplierPages";
import { SupplierOffersPage, SupplierPreOrderDetailPage } from "./pages/SupplierOffersPage";
import { SupplierClientsReportPage, SupplierPurchasesReportPage } from "./pages/SupplierReportsPage";
import { TutorialPage } from "./pages/TutorialPage";
import { ViabilitySimulatorPage } from "./pages/ViabilitySimulatorPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: "12px", fontSize: "14px" },
            success: { iconTheme: { primary: "#F97316", secondary: "#fff" } },
          }}
        />
        <InstallBanner />
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/ofertas" element={<OffersPage />} />
          <Route path="/ofertas/:id" element={<OfferDetailPage />} />
          <Route path="/comprador" element={<BuyerDashboardPage />} />
          <Route path="/comprador/market" element={<BuyerMarketPage />} />
          <Route path="/comprador/compra-coletiva" element={<BuyerCollectivePage />} />
          <Route path="/comprador/minhas-compras" element={<BuyerPurchasesPage />} />
          <Route path="/comprador/minhas-compras/:id" element={<BuyerPurchaseDetailPage />} />
          <Route path="/comprador/relatorio" element={<BuyerReportsPage />} />
          <Route path="/comprador/pedidos" element={<Navigate to="/comprador/minhas-compras" replace />} />
          <Route path="/comprador/ofertas-participando" element={<Navigate to="/comprador/minhas-compras" replace />} />
          <Route path="/comprador/compras-realizadas" element={<Navigate to="/comprador/minhas-compras" replace />} />
          <Route path="/fornecedor" element={<SupplierDashboardPage />} />
          <Route path="/fornecedor/criar-oferta" element={<SupplierCreateOfferPage />} />
          <Route path="/fornecedor/ofertas" element={<SupplierOffersPage />} />
          <Route path="/fornecedor/ofertas/:id" element={<SupplierOfferDetailPage />} />
          <Route path="/fornecedor/pedidos" element={<SupplierPreOrdersPage />} />
          <Route path="/fornecedor/pre-pedidos" element={<Navigate to="/fornecedor/pedidos" replace />} />
          <Route path="/fornecedor/pre-pedidos/:id" element={<SupplierPreOrderDetailPage />} />
          <Route path="/fornecedor/relatorio-clientes" element={<SupplierClientsReportPage />} />
          <Route path="/fornecedor/relatorio-compras" element={<SupplierPurchasesReportPage />} />
          <Route path="/fornecedor/simulador" element={<ViabilitySimulatorPage />} />
          <Route path="/avaliacoes" element={<RatingsPage />} />
          <Route path="/dados-cadastrais" element={<ProfilePage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/tutorial" element={<TutorialPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/gestao" element={<GestaoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <MobileNav />
      </BrowserRouter>
    </AppProvider>
  );
}
