import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./components/AppProvider";
import { Header } from "./components/Header";
import { MobileNav } from "./components/MobileNav";
import { InstallBanner } from "./components/InstallBanner";
import { AdminPage } from "./pages/AdminPage";
import { AuthPage } from "./pages/AuthPage";
import { BuyerDashboardPage } from "./pages/BuyerDashboardPage";
import { BuyerOrdersPage } from "./pages/BuyerOrdersPage";
import { BuyerCompletedPurchasesPage, BuyerParticipatingOffersPage } from "./pages/BuyerReportsPage";
import { GestaoPage } from "./pages/GestaoPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { OfferDetailPage } from "./pages/OfferDetailPage";
import { OffersPage } from "./pages/OffersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RatingsPage } from "./pages/RatingsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SupplierCreateOfferPage, SupplierDashboardPage, SupplierOfferDetailPage } from "./pages/SupplierPages";
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
          <Route path="/comprador/pedidos" element={<BuyerOrdersPage />} />
          <Route path="/comprador/ofertas-participando" element={<BuyerParticipatingOffersPage />} />
          <Route path="/comprador/compras-realizadas" element={<BuyerCompletedPurchasesPage />} />
          <Route path="/fornecedor" element={<SupplierDashboardPage />} />
          <Route path="/fornecedor/criar-oferta" element={<SupplierCreateOfferPage />} />
          <Route path="/fornecedor/ofertas" element={<SupplierDashboardPage />} />
          <Route path="/fornecedor/ofertas/:id" element={<SupplierOfferDetailPage />} />
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
