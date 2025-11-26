import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate } from "react-router";
import { LogOut, Download, Users, Filter, Plus, Trash2 } from "lucide-react";
import CreateUserModal from "@/react-app/components/CreateUserModal";
import DeleteUserModal from "@/react-app/components/DeleteUserModal";

interface AdminSession {
  id: number;
  user_id: number;
  full_name: string;
  username: string;
  os_number: string;
  engine_model: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  total_time_seconds: number;
}

interface User {
  id: number;
  full_name: string;
  username: string;
  is_admin: boolean;
  is_active: boolean;
}

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<"sessions" | "users">("sessions");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showDeleteUser, setShowDeleteUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [filters, setFilters] = useState({
    user_id: "",
    status: "",
    os_number: "",
    engine_model: "",
  });

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const loadData = async () => {
    if (activeTab === "sessions") {
      await loadSessions();
    } else {
      await loadUsers();
    }
  };

  const loadSessions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.user_id) params.append("user_id", filters.user_id);
      if (filters.status) params.append("status", filters.status);
      if (filters.os_number) params.append("os_number", filters.os_number);
      if (filters.engine_model) params.append("engine_model", filters.engine_model);

      const response = await fetch(`/api/admin/sessions?${params}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/export", {
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cronometragens-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting:", error);
    }
  };

  const handleToggleUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
        credentials: "include",
      });

      if (response.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (pin?: string) => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_pin: pin }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao excluir usuário");
      }

      setShowDeleteUser(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { label: "Em Andamento", className: "bg-green-100 text-green-800" },
      paused: { label: "Pausado", className: "bg-yellow-100 text-yellow-800" },
      finished: { label: "Finalizado", className: "bg-blue-100 text-blue-800" },
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.finished;
    return (
      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900">Painel Administrativo</h1>
              <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Gestão completa do sistema</p>
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
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex gap-1 sm:gap-2 bg-white/80 backdrop-blur-lg rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab("sessions")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm ${
                activeTab === "sessions"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Cronometragens</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-medium transition-all text-sm ${
                activeTab === "users"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuários</span>
            </button>
          </div>

          {activeTab === "sessions" ? (
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
            >
              <Download className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>Exportar Excel</span>
            </button>
          ) : (
            <button
              onClick={() => setShowCreateUser(true)}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm"
            >
              <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
              <span>Novo Usuário</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === "sessions" ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Filters */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-4 sm:p-6 border border-slate-200">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Filtros</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <input
                  type="text"
                  placeholder="Número da O.S."
                  value={filters.os_number}
                  onChange={(e) => setFilters({ ...filters, os_number: e.target.value })}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  placeholder="Modelo do Motor"
                  value={filters.engine_model}
                  onChange={(e) => setFilters({ ...filters, engine_model: e.target.value })}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Todos os Status</option>
                  <option value="active">Em Andamento</option>
                  <option value="paused">Pausado</option>
                  <option value="finished">Finalizado</option>
                </select>
                <button
                  onClick={() => setFilters({ user_id: "", status: "", os_number: "", engine_model: "" })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors text-sm"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Usuário</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">O.S.</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900 hidden sm:table-cell">Modelo</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Status</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900 hidden md:table-cell">Início</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Tempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">{session.full_name}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900">{session.os_number}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 hidden sm:table-cell">{session.engine_model}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">{getStatusBadge(session.status)}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 hidden md:table-cell">
                          {new Date(session.started_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Sao_Paulo",
                          })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-blue-600">
                          {session.total_time_seconds > 0 ? formatTime(session.total_time_seconds) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Nome Completo</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900 hidden sm:table-cell">Usuário</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Tipo</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-900">{u.full_name}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900 hidden sm:table-cell">{u.username}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        {u.is_admin ? (
                          <span className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                            Admin
                          </span>
                        ) : (
                          <span className="px-2 sm:px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold">
                            Montador
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        {u.is_active ? (
                          <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                          >
                            {u.is_active ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => {
                              setUserToDelete(u);
                              setShowDeleteUser(true);
                            }}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors text-xs sm:text-sm flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <CreateUserModal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onSuccess={() => {
          setShowCreateUser(false);
          loadUsers();
        }}
      />

      <DeleteUserModal
        isOpen={showDeleteUser}
        onClose={() => {
          setShowDeleteUser(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDeleteUser}
        userName={userToDelete?.full_name || ""}
        isAdmin={userToDelete?.is_admin || false}
      />
    </div>
  );
}
