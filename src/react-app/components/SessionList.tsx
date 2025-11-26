import { useState, useEffect } from "react";
import { Play, Clock, Pause, Square } from "lucide-react";
import PauseModal from "@/react-app/components/PauseModal";

interface Session {
  id: number;
  os_number: string;
  engine_model: string;
  status: "active" | "paused" | "finished";
  started_at: string;
  finished_at: string | null;
  total_time_seconds: number;
  pauses: Array<{
    id: number;
    paused_at: string;
    resumed_at: string | null;
    observation: string;
    duration_seconds: number;
  }>;
  elapsed_time?: number;
}

interface SessionListProps {
  onSessionChange: () => void;
}

export default function SessionList({ onSessionChange }: SessionListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [sessionToFinish, setSessionToFinish] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for real-time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000); // Reload data every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/sessions/all", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateElapsedTime = (session: Session): number => {
    const startTime = new Date(session.started_at).getTime();
    const now = currentTime;
    let elapsed = Math.floor((now - startTime) / 1000);

    for (const pause of session.pauses) {
      if (pause.resumed_at) {
        elapsed -= pause.duration_seconds;
      } else if (session.status === "paused") {
        const pauseStart = new Date(pause.paused_at).getTime();
        const pauseDuration = Math.floor((now - pauseStart) / 1000);
        elapsed -= pauseDuration;
      }
    }

    return Math.max(0, elapsed);
  };

  const handleResume = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/resume`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        await loadSessions();
        onSessionChange();
      }
    } catch (error) {
      console.error("Error resuming session:", error);
    }
  };

  const handlePause = async (sessionId: number) => {
    setSessionToFinish(sessionId);
    setShowPauseModal(true);
  };

  const handlePauseConfirm = async (observation: string) => {
    if (!sessionToFinish) return;

    try {
      const response = await fetch(`/api/sessions/${sessionToFinish}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observation }),
        credentials: "include",
      });

      if (response.ok) {
        await loadSessions();
        onSessionChange();
        setShowPauseModal(false);
        setSessionToFinish(null);
      }
    } catch (error) {
      console.error("Error pausing session:", error);
    }
  };

  const handleFinish = async (sessionId: number) => {
    if (!confirm("Tem certeza que deseja finalizar esta cronometragem?")) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}/finish`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        await loadSessions();
        onSessionChange();
      }
    } catch (error) {
      console.error("Error finishing session:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const activeSessions = sessions.filter(s => s.status === "active" || s.status === "paused");

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (activeSessions.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 sm:p-12 border border-slate-200 text-center">
        <div className="text-slate-400 mb-4">
          <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
          Nenhuma cronometragem ativa
        </h3>
        <p className="text-sm sm:text-base text-slate-600">
          Inicie uma nova cronometragem acima
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Minhas Cronometragens</h2>

      {activeSessions.map((session) => {
        const elapsedTime = calculateElapsedTime(session);
        const isActive = session.status === "active";

        return (
          <div
            key={session.id}
            className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border overflow-hidden transition-all ${
              isActive
                ? "border-blue-500 ring-2 ring-blue-500/20"
                : "border-slate-200"
            }`}
          >
            <div className={`p-4 sm:p-6 ${isActive ? "bg-gradient-to-br from-blue-50 to-slate-50" : ""}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-lg sm:text-xl font-bold text-slate-900">
                      O.S. {session.os_number}
                    </div>
                    {isActive && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                        EM ANDAMENTO
                      </span>
                    )}
                    {session.status === "paused" && (
                      <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-semibold rounded-full">
                        PAUSADO
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">{session.engine_model}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Iniciado em {new Date(session.started_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Sao_Paulo",
                    })}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl">
                  <div className="text-xs text-blue-200 mb-1">Tempo Decorrido</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono">
                    {formatTime(elapsedTime)}
                  </div>
                </div>
              </div>

              {session.pauses.length > 0 && (
                <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Pausas ({session.pauses.length})
                  </div>
                  <div className="space-y-1">
                    {session.pauses.slice(-3).map((pause) => (
                      <div key={pause.id} className="text-xs text-slate-600">
                        • {pause.observation}
                        {pause.resumed_at && ` (${Math.floor(pause.duration_seconds / 60)} min)`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {isActive ? (
                  <>
                    <button
                      onClick={() => handlePause(session.id)}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pausar</span>
                    </button>
                    <button
                      onClick={() => handleFinish(session.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Square className="w-4 h-4" />
                      <span>Finalizar</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleResume(session.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Play className="w-4 h-4" />
                    <span>Retomar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <PauseModal
        isOpen={showPauseModal}
        onClose={() => {
          setShowPauseModal(false);
          setSessionToFinish(null);
        }}
        onConfirm={handlePauseConfirm}
      />
    </div>
  );
}
