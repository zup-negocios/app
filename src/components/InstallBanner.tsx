import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("zuppi_install_dismissed") === "1"
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  const handleInstall = async () => {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem("zuppi_install_dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-white rounded-2xl shadow-xl border border-orange-100 p-4 flex items-center gap-3 animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-black text-lg">Z</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">Instale o app Zup</p>
        <p className="text-xs text-gray-500">Acesso rápido no seu celular</p>
      </div>
      <button onClick={handleInstall} className="btn-primary text-xs py-1.5 px-3 flex-shrink-0">
        <Download size={13} /> Instalar
      </button>
      <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}
