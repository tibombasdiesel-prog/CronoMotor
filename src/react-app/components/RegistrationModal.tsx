import { useState } from "react";
import { X, User, UserCog } from "lucide-react";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountType: "user" | "admin";
}

export default function RegistrationModal({ isOpen, onClose, onSuccess, accountType }: RegistrationModalProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length !== 4 || !/^\d+$/.test(password)) {
      setError("A senha deve ter exatamente 4 dígitos");
      return;
    }

    if (accountType === "admin" && pin !== "2233") {
      setError("PIN administrativo inválido");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          full_name: fullName, 
          username, 
          password,
          is_admin: accountType === "admin",
          admin_pin: accountType === "admin" ? pin : undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar conta");
      }

      setFullName("");
      setUsername("");
      setPassword("");
      setPin("");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              accountType === "admin" 
                ? "bg-purple-100 text-purple-600" 
                : "bg-blue-100 text-blue-600"
            }`}>
              {accountType === "admin" ? <UserCog className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {accountType === "admin" ? "Criar Conta Administrativa" : "Criar Conta"}
              </h2>
              <p className="text-xs text-slate-600">
                {accountType === "admin" ? "Acesso total ao sistema" : "Acesso para colaborador"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Digite seu nome completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome de Usuário *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="Escolha um nome de usuário"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Senha (4 dígitos) *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              placeholder="••••"
              maxLength={4}
              required
            />
          </div>

          {accountType === "admin" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                PIN Administrativo *
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-4 py-3 bg-purple-50 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                placeholder="Digite o PIN administrativo"
                maxLength={4}
                required
              />
              <p className="mt-2 text-xs text-slate-500">
                Somente pessoas autorizadas possuem o PIN administrativo
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 sm:py-3 px-4 rounded-xl font-semibold transition-colors text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 ${
                accountType === "admin"
                  ? "bg-gradient-to-r from-purple-500 to-purple-600"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              } text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base`}
            >
              {isLoading ? "Criando..." : "Criar Conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
