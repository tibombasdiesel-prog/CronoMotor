import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin?: string) => void;
  userName: string;
  isAdmin: boolean;
}

export default function DeleteUserModal({ isOpen, onClose, onConfirm, userName, isAdmin }: DeleteUserModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAdmin) {
      if (pin !== "2233") {
        setError("PIN administrativo inválido");
        return;
      }
      onConfirm(pin);
    } else {
      onConfirm();
    }
    
    setPin("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-red-200">
        <div className="flex justify-between items-center mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Excluir Usuário</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5 sm:mb-6">
            <p className="text-sm sm:text-base text-slate-700 mb-4">
              Tem certeza que deseja excluir o usuário{" "}
              <span className="font-semibold">{userName}</span>?
            </p>
            
            {isAdmin && (
              <>
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl mb-4">
                  <p className="text-sm text-purple-900 font-medium">
                    Este é um usuário administrativo. Digite o PIN para confirmar a exclusão.
                  </p>
                </div>
                
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  PIN Administrativo *
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-full px-4 py-3 bg-purple-50 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                  placeholder="Digite o PIN (2233)"
                  maxLength={4}
                  required
                />
              </>
            )}
            
            <p className="text-xs sm:text-sm text-red-600 mt-3">
              ⚠️ Esta ação não pode ser desfeita.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

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
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-red-600 hover:to-red-700 transition-all text-sm sm:text-base"
            >
              Excluir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
