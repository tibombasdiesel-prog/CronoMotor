import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate } from "react-router";
import NewSessionForm from "@/react-app/components/NewSessionForm";
import SessionList from "@/react-app/components/SessionList";
import SessionHistory from "@/react-app/components/SessionHistory";
import { LogOut, History, PlayCircle } from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"timer" | "history">("timer");
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkActiveSession();
  }, [refreshKey]);

  const checkActiveSession = async () => {
    try {
      const response = await fetch("/api/sessions/active", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setHasActiveSession(data && data.status === "active");
      }
    } catch (error) {
      console.error("Error checking active session:", error);
    }
  };

  const handleSessionChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="https://mocha-cdn.com/019abba6-318d-7402-842d-1ac273eebcde/logo-bombas-diesel-dark.png" 
                alt="Bombas Diesel"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900">CronoMotor</h1>
                <p className="text-xs sm:text-sm text-slate-600">Olá, {user.full_name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium text-sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
        <div className="flex gap-1 sm:gap-2 bg-white/80 backdrop-blur-lg rounded-xl p-1 border border-slate-200 w-full sm:w-fit">
          <button
            onClick={() => setActiveView("timer")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm ${
              activeView === "timer"
                ? "bg-blue-500 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>Cronômetros</span>
          </button>
          <button
            onClick={() => setActiveView("history")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm ${
              activeView === "history"
                ? "bg-blue-500 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === "timer" ? (
          <div className="space-y-6">
            <NewSessionForm 
              onSessionCreated={handleSessionChange}
              hasActiveSession={hasActiveSession}
            />
            <SessionList onSessionChange={handleSessionChange} />
          </div>
        ) : (
          <SessionHistory />
        )}
      </main>
    </div>
  );
}
