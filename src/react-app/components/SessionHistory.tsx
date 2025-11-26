import { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";

interface HistorySession {
  id: number;
  os_number: string;
  engine_model: string;
  started_at: string;
  finished_at: string;
  total_time_seconds: number;
}

export default function SessionHistory() {
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch("/api/sessions/history", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 sm:p-12 border border-slate-200 text-center">
        <div className="text-slate-400 mb-4">
          <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Nenhum histórico ainda</h3>
        <p className="text-sm sm:text-base text-slate-600">Suas cronometragens finalizadas aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Histórico de Cronometragens</h2>
      </div>

      <div className="divide-y divide-slate-200">
        {sessions.map((session) => (
          <div key={session.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
              <div className="flex-1">
                <div className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
                  O.S. {session.os_number}
                </div>
                <div className="text-sm text-slate-600">{session.engine_model}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-bold text-base sm:text-lg text-center sm:text-left">
                {formatTime(session.total_time_seconds)}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                {new Date(session.started_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                {new Date(session.started_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Sao_Paulo",
                })}
                {" - "}
                {new Date(session.finished_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Sao_Paulo",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
