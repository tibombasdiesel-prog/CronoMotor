import { useState } from "react";
import { X } from "lucide-react";

interface PauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (observation: string) => void;
}

export default function PauseModal({ isOpen, onClose, onConfirm }: PauseModalProps) {
  const [observation, setObservation] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (observation.trim()) {
      onConfirm(observation.trim());
      setObservation("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-5 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Motivo da Pausa</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observação *
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Faltando peça, Aguardando análise..."
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-base"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 sm:py-3 px-4 rounded-xl font-semibold transition-colors text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-yellow-600 hover:to-yellow-700 transition-all text-sm sm:text-base"
            >
              Confirmar Pausa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
