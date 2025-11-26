import { useState } from "react";
import { Play } from "lucide-react";
import PauseModal from "@/react-app/components/PauseModal";

interface NewSessionFormProps {
  onSessionCreated: () => void;
  hasActiveSession: boolean;
}

export default function NewSessionForm({ onSessionCreated, hasActiveSession }: NewSessionFormProps) {
  const [osNumber, setOsNumber] = useState("");
  const [engineModel, setEngineModel] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pendingSession, setPendingSession] = useState<{ os_number: string; engine_model: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!osNumber.trim() || !engineModel.trim()) {
      setError("Preencha o número da O.S. e o modelo do motor");
      return;
    }

    if (hasActiveSession) {
      setPendingSession({ os_number: osNumber, engine_model: engineModel });
      setShowPauseModal(true);
      return;
    }

    await createSession(osNumber, engineModel);
  };

  const handlePauseAndCreate = async (observation: string) => {
    if (!pendingSession) return;

    try {
      const response = await fetch("/api/sessions/pause-active-and-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          os_number: pendingSession.os_number,
          engine_model: pendingSession.engine_model,
          pause_observation: observation,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setShowPauseModal(false);
      setPendingSession(null);
      setOsNumber("");
      setEngineModel("");
      setError("");
      onSessionCreated();
    } catch (err: any) {
      setError(err.message || "Erro ao criar cronometragem");
    }
  };

  const createSession = async (os: string, model: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ os_number: os, engine_model: model }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setOsNumber("");
      setEngineModel("");
      onSessionCreated();
    } catch (err: any) {
      setError(err.message || "Erro ao iniciar cronometragem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-6 border border-slate-200">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
          {hasActiveSession ? "Iniciar Nova Cronometragem" : "Iniciar Cronometragem"}
        </h2>

        {hasActiveSession && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
            <strong>Atenção:</strong> Você tem uma cronometragem ativa. Ao iniciar uma nova, a atual será automaticamente pausada.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Número da O.S. *
            </label>
            <input
              type="text"
              value={osNumber}
              onChange={(e) => setOsNumber(e.target.value)}
              placeholder="Ex: 24512"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Modelo do Motor *
            </label>
            <input
              type="text"
              value={engineModel}
              onChange={(e) => setEngineModel(e.target.value)}
              placeholder="Ex: Motor X500"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 sm:py-3.5 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 text-base"
          >
            <Play className="w-5 h-5" />
            {isLoading ? "Iniciando..." : "Iniciar Cronometragem"}
          </button>
        </form>
      </div>

      <PauseModal
        isOpen={showPauseModal}
        onClose={() => {
          setShowPauseModal(false);
          setPendingSession(null);
        }}
        onConfirm={handlePauseAndCreate}
      />
    </>
  );
}
