import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { Lock, User, MoreVertical, UserCog } from "lucide-react";
import RegistrationModal from "@/react-app/components/RegistrationModal";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [loginType, setLoginType] = useState<"user" | "admin">("user");
  const [showRegistration, setShowRegistration] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.is_admin ? "/admin" : "/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password.length !== 4 || !/^\d+$/.test(password)) {
      setError("A senha deve ter exatamente 4 dígitos");
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>

      <div className="w-full max-w-md relative">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
          {/* Menu Button */}
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
              >
                <MoreVertical className="w-5 h-5 text-white" />
              </button>
              
              {showMenu && (
                <div className="absolute top-12 left-0 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden min-w-[200px] z-10">
                  <button
                    onClick={() => {
                      setLoginType("user");
                      setShowMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      loginType === "user"
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">Colaborador</div>
                      <div className="text-xs opacity-70">Acesso padrão</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setLoginType("admin");
                      setShowMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${
                      loginType === "admin"
                        ? "bg-purple-50 text-purple-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <UserCog className="w-5 h-5" />
                    <div>
                      <div className="font-semibold">Administrador</div>
                      <div className="text-xs opacity-70">Acesso total</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center mb-6 sm:mb-8 mt-8 sm:mt-0">
            <div className="mb-3 sm:mb-4">
              <img 
                src="https://mocha-cdn.com/019abba6-318d-7402-842d-1ac273eebcde/logo-bombas-diesel-dark.png" 
                alt="Bombas Diesel"
                className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">CronoMotor</h1>
            <p className="text-sm sm:text-base text-blue-200 text-center">Sistema de cronometragem de montagem</p>
            <div className="mt-3">
              {loginType === "admin" ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-200 text-sm font-medium">
                  <UserCog className="w-4 h-4" />
                  Login Administrativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-200 text-sm font-medium">
                  <User className="w-4 h-4" />
                  Login Colaborador
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Nome de Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                  placeholder="Digite seu usuário"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-100 mb-2">
                Senha (4 dígitos)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 sm:py-3.5 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] text-base"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowRegistration(true)}
              className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
            >
              Ainda não tem uma conta? <span className="underline">Criar conta</span>
            </button>
          </div>
        </div>
      </div>

      <RegistrationModal
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={() => {
          setShowRegistration(false);
          setError("");
          alert("Conta criada com sucesso! Faça login para continuar.");
        }}
        accountType={loginType}
      />
    </div>
  );
}
