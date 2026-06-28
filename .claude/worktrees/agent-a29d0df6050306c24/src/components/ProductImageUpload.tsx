import { useRef, useState } from "react";
import { TrendingUp, X, ImagePlus } from "lucide-react";

interface Props {
  value?: string | null;
  onChange: (base64: string | null) => void;
}

export function ProductImageUpload({ value, onChange }: Props) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Imagem deve ter no máximo 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onChange(base64);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        className="border-2 border-dashed border-orange-200 rounded-2xl p-6 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all text-center group"
      >
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="max-h-44 mx-auto rounded-xl object-contain" />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setPreview(null); onChange(null); }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-100 transition-colors">
              <ImagePlus size={22} className="text-orange-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Clique ou arraste uma foto do produto</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP · até 5MB</p>
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />

      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-3">
        <TrendingUp size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-700">Ofertas com foto têm 60% mais chance de aceite</p>
          <p className="text-xs text-green-600 mt-0.5 leading-relaxed">
            Compradores confiam mais em produtos com imagem. Adicione uma foto para aumentar o engajamento da sua oferta.
          </p>
        </div>
      </div>
    </div>
  );
}
