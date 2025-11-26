import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";

interface UserRow {
  id: number;
  full_name: string;
  username: string;
  password_hash: string;
  is_admin: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface ContextVariables {
  user: UserRow;
}

const app = new Hono<{ Bindings: Env; Variables: ContextVariables }>();

app.use("*", cors({
  origin: "*",
  credentials: true,
}));

// Session cookie name
const SESSION_COOKIE = "engine_timer_session";

// Middleware to get current user from session
async function getCurrentUser(c: any): Promise<UserRow | null> {
  const sessionId = getCookie(c, SESSION_COOKIE);
  if (!sessionId) return null;

  const result = await c.env.DB.prepare(
    "SELECT id, full_name, username, password_hash, is_admin, is_active, created_at, updated_at FROM users WHERE id = ? AND is_active = 1"
  ).bind(parseInt(sessionId)).first();

  return result as UserRow | null;
}

// Auth middleware
async function authMiddleware(c: any, next: any) {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: "Não autorizado" }, 401);
  }
  c.set("user", user);
  await next();
}

// Admin middleware
async function adminMiddleware(c: any, next: any) {
  const user = c.get("user") as UserRow;
  if (!user || !user.is_admin) {
    return c.json({ error: "Acesso negado" }, 403);
  }
  await next();
}

// Public registration endpoint
app.post("/api/register", async (c) => {
  try {
    const { full_name, username, password, is_admin, admin_pin } = await c.req.json();

    // Validate admin PIN if creating admin account
    if (is_admin && admin_pin !== "2233") {
      return c.json({ error: "PIN administrativo inválido" }, 403);
    }

    // Check if username exists
    const existing = await c.env.DB.prepare(
      "SELECT id FROM users WHERE username = ?"
    ).bind(username).first();

    if (existing) {
      return c.json({ error: "Nome de usuário já existe" }, 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await c.env.DB.prepare(
      "INSERT INTO users (full_name, username, password_hash, is_admin) VALUES (?, ?, ?, ?)"
    ).bind(full_name, username, passwordHash, is_admin ? 1 : 0).run();

    return c.json({ 
      id: result.meta.last_row_id, 
      full_name, 
      username,
      message: "Conta criada com sucesso! Faça login para continuar."
    });
  } catch (error) {
    return c.json({ error: "Erro ao criar conta" }, 500);
  }
});

// Login
app.post("/api/login", async (c) => {
  try {
    const { username, password } = await c.req.json();

    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE username = ? AND is_active = 1"
    ).bind(username).first() as UserRow | null;

    if (!user) {
      return c.json({ error: "Usuário ou senha inválidos" }, 401);
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return c.json({ error: "Usuário ou senha inválidos" }, 401);
    }

    setCookie(c, SESSION_COOKIE, user.id.toString(), {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return c.json({
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      is_admin: user.is_admin,
    });
  } catch (error) {
    return c.json({ error: "Erro ao fazer login" }, 500);
  }
});

// Logout
app.post("/api/logout", async (c) => {
  deleteCookie(c, SESSION_COOKIE);
  return c.json({ success: true });
});

// Get current user
app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user") as UserRow;
  return c.json({
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    is_admin: user.is_admin,
  });
});

// Create user (admin only)
app.post("/api/users", authMiddleware, adminMiddleware, async (c) => {
  try {
    const { full_name, username, password } = await c.req.json();

    // Check if username exists
    const existing = await c.env.DB.prepare(
      "SELECT id FROM users WHERE username = ?"
    ).bind(username).first();

    if (existing) {
      return c.json({ error: "Nome de usuário já existe" }, 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await c.env.DB.prepare(
      "INSERT INTO users (full_name, username, password_hash) VALUES (?, ?, ?)"
    ).bind(full_name, username, passwordHash).run();

    return c.json({ id: result.meta.last_row_id, full_name, username });
  } catch (error) {
    return c.json({ error: "Erro ao criar usuário" }, 500);
  }
});

// List users (admin only)
app.get("/api/users", authMiddleware, adminMiddleware, async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, full_name, username, is_admin, is_active, created_at FROM users ORDER BY created_at DESC"
  ).all();

  return c.json(results);
});

// Update user (admin only)
app.put("/api/users/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const id = c.req.param("id");
    const { is_active } = await c.req.json();

    await c.env.DB.prepare(
      "UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(is_active ? 1 : 0, parseInt(id)).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Erro ao atualizar usuário" }, 500);
  }
});

// Get active session
app.get("/api/sessions/active", authMiddleware, async (c) => {
  const user = c.get("user") as UserRow;

  const session = await c.env.DB.prepare(
    "SELECT * FROM engine_sessions WHERE user_id = ? AND status = 'active' ORDER BY started_at DESC LIMIT 1"
  ).bind(user.id).first();

  if (!session) {
    return c.json(null);
  }

  const { results: pauses } = await c.env.DB.prepare(
    "SELECT * FROM pauses WHERE session_id = ? ORDER BY paused_at ASC"
  ).bind((session as any).id).all();

  return c.json({ ...session, pauses });
});

// Get all active and paused sessions
app.get("/api/sessions/all", authMiddleware, async (c) => {
  const user = c.get("user") as UserRow;

  const { results: sessions } = await c.env.DB.prepare(
    "SELECT * FROM engine_sessions WHERE user_id = ? AND status IN ('active', 'paused') ORDER BY started_at DESC"
  ).bind(user.id).all();

  const sessionsWithPauses = [];
  for (const session of sessions as any[]) {
    const { results: pauses } = await c.env.DB.prepare(
      "SELECT * FROM pauses WHERE session_id = ? ORDER BY paused_at ASC"
    ).bind(session.id).all();
    
    sessionsWithPauses.push({ ...session, pauses });
  }

  return c.json(sessionsWithPauses);
});

// Start new session
app.post("/api/sessions", authMiddleware, async (c) => {
  try {
    const user = c.get("user") as UserRow;
    const { os_number, engine_model } = await c.req.json();

    // Check for active session (not paused)
    const activeSession = await c.env.DB.prepare(
      "SELECT id FROM engine_sessions WHERE user_id = ? AND status = 'active'"
    ).bind(user.id).first();

    if (activeSession) {
      return c.json({ error: "Você já tem uma cronometragem ativa" }, 400);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO engine_sessions (user_id, os_number, engine_model, status, started_at) VALUES (?, ?, ?, 'active', datetime('now', '-3 hours'))"
    ).bind(user.id, os_number, engine_model).run();

    const newSession = await c.env.DB.prepare(
      "SELECT * FROM engine_sessions WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json({ ...newSession, pauses: [] });
  } catch (error) {
    return c.json({ error: "Erro ao iniciar sessão" }, 500);
  }
});

// Pause active session and create new one
app.post("/api/sessions/pause-active-and-create", authMiddleware, async (c) => {
  try {
    const user = c.get("user") as UserRow;
    const { os_number, engine_model, pause_observation } = await c.req.json();

    // Find active session
    const activeSession = await c.env.DB.prepare(
      "SELECT * FROM engine_sessions WHERE user_id = ? AND status = 'active'"
    ).bind(user.id).first() as any;

    if (!activeSession) {
      return c.json({ error: "Nenhuma sessão ativa encontrada" }, 400);
    }

    // Pause the active session
    await c.env.DB.prepare(
      "UPDATE engine_sessions SET status = 'paused', updated_at = datetime('now', '-3 hours') WHERE id = ?"
    ).bind(activeSession.id).run();

    await c.env.DB.prepare(
      "INSERT INTO pauses (session_id, paused_at, observation) VALUES (?, datetime('now', '-3 hours'), ?)"
    ).bind(activeSession.id, pause_observation).run();

    // Create new session
    const result = await c.env.DB.prepare(
      "INSERT INTO engine_sessions (user_id, os_number, engine_model, status, started_at) VALUES (?, ?, ?, 'active', datetime('now', '-3 hours'))"
    ).bind(user.id, os_number, engine_model).run();

    const newSession = await c.env.DB.prepare(
      "SELECT * FROM engine_sessions WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json({ ...newSession, pauses: [] });
  } catch (error) {
    return c.json({ error: "Erro ao criar sessão" }, 500);
  }
});

// Pause session
app.post("/api/sessions/:id/pause", authMiddleware, async (c) => {
  try {
    const user = c.get("user") as UserRow;
    const sessionId = parseInt(c.req.param("id"));
    const { observation } = await c.req.json();

    const session = await c.env.DB.prepare(
      "SELECT * FROM engine_sessions WHERE id = ? AND user_id = ?"
    ).bind(sessionId, user.id).first() as any;

    if (!session) {
      return c.json({ error: "Sessão não encontrada" }, 404);
    }

    if (session.status !== 'active') {
      return c.json({ error: "Sessão não está ativa" }, 400);
    }

    await c.env.DB.prepare(
      "UPDATE engine_sessions SET status = 'paused', updated_at = datetime('now', '-3 hours') WHERE id = ?"
    ).bind(sessionId).run();

    await c.env.DB.prepare(
      "INSERT INTO pauses (session_id, paused_at, observation) VALUES (?, datetime('now', '-3 hours'), ?)"
    ).bind(sessionId, observation).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Erro ao pausar sessão" }, 500);
  }
});

// Resume session
app.post("/api/sessions/:id/resume", authMiddleware, async (c) => {
  try {
    const user = c.get("user") as UserRow;
    const sessionId = parseInt(c.req.param("id"));

    const session = await c.env.DB.prepare(
      "SELECT * FROM engine_sessions WHERE id = ? AND user_id = ?"
    ).bind(sessionId, user.id).first() as any;

    if (!session) {
      return c.json({ error: "Sessão não encontrada" }, 404);
    }

    if (session.status !== 'paused') {
      return c.json({ error: "Sessão não está pausada" }, 400);
    }

    // Check if there's already an active session
    const activeSession = await c.env.DB.prepare(
      "SELECT id FROM engine_sessions WHERE user_id = ? AND status = 'active' AND id != ?"
    ).bind(user.id, sessionId).first();

    if (activeSession) {
      return c.json({ error: "Você já tem uma cronometragem ativa. Pause-a antes de retomar outra." }, 400);
    }

    const lastPause = await c.env.DB.prepare(
      "SELECT * FROM pauses WHERE session_id = ? AND resumed_at IS NULL ORDER BY paused_at DESC LIMIT 1"
    ).bind(sessionId).first() as any;

    if (lastPause) {
      // Use database timestamp with Brazil timezone offset
      const currentTime = await c.env.DB.prepare("SELECT unixepoch('now', '-3 hours') as now").first() as any;
      const pauseStartTime = await c.env.DB.prepare("SELECT unixepoch(?) as time").bind(lastPause.paused_at).first() as any;
      const pauseDuration = currentTime.now - pauseStartTime.time;
      
      await c.env.DB.prepare(
        "UPDATE pauses SET resumed_at = datetime('now', '-3 hours'), duration_seconds = ?, updated_at = datetime('now', '-3 hours') WHERE id = ?"
      ).bind(pauseDuration, lastPause.id).run();
    }

    await c.env.DB.prepare(
      "UPDATE engine_sessions SET status = 'active', updated_at = datetime('now', '-3 hours') WHERE id = ?"
    ).bind(sessionId).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Erro ao retomar sessão" }, 500);
  }
});

// Finish session
app.post("/api/sessions/:id/finish", authMiddleware, async (c) => {
  try {
    const user = c.get("user") as UserRow;
    const sessionId = parseInt(c.req.param("id"));

    const session = await c.env.DB.prepare(
      "SELECT * FROM engine_sessions WHERE id = ? AND user_id = ?"
    ).bind(sessionId, user.id).first() as any;

    if (!session) {
      return c.json({ error: "Sessão não encontrada" }, 404);
    }

    if (session.status === 'finished') {
      return c.json({ error: "Sessão já foi finalizada" }, 400);
    }

    // Use database time with Brazil timezone offset
    const currentTime = await c.env.DB.prepare("SELECT unixepoch('now', '-3 hours') as now").first() as any;
    const startTimeResult = await c.env.DB.prepare("SELECT unixepoch(?) as time").bind(session.started_at).first() as any;
    let totalSeconds = currentTime.now - startTimeResult.time;

    // Subtract pause durations
    const { results: pauses } = await c.env.DB.prepare(
      "SELECT * FROM pauses WHERE session_id = ?"
    ).bind(sessionId).all();

    for (const pause of pauses) {
      const p = pause as any;
      if (p.resumed_at) {
        totalSeconds -= p.duration_seconds;
      } else {
        // Active pause - calculate duration and update
        const pauseStartResult = await c.env.DB.prepare("SELECT unixepoch(?) as time").bind(p.paused_at).first() as any;
        const pauseDuration = currentTime.now - pauseStartResult.time;
        totalSeconds -= pauseDuration;
        
        await c.env.DB.prepare(
          "UPDATE pauses SET resumed_at = datetime('now', '-3 hours'), duration_seconds = ?, updated_at = datetime('now', '-3 hours') WHERE id = ?"
        ).bind(pauseDuration, p.id).run();
      }
    }

    await c.env.DB.prepare(
      "UPDATE engine_sessions SET status = 'finished', finished_at = datetime('now', '-3 hours'), total_time_seconds = ?, updated_at = datetime('now', '-3 hours') WHERE id = ?"
    ).bind(totalSeconds, sessionId).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Erro ao finalizar sessão" }, 500);
  }
});

// Get session history
app.get("/api/sessions/history", authMiddleware, async (c) => {
  const user = c.get("user") as UserRow;

  const { results } = await c.env.DB.prepare(
    "SELECT * FROM engine_sessions WHERE user_id = ? AND status = 'finished' ORDER BY started_at DESC"
  ).bind(user.id).all();

  return c.json(results);
});

// Admin: Get all sessions with filters
app.get("/api/admin/sessions", authMiddleware, adminMiddleware, async (c) => {
  const userId = c.req.query("user_id");
  const status = c.req.query("status");
  const osNumber = c.req.query("os_number");
  const engineModel = c.req.query("engine_model");

  let query = `
    SELECT s.*, u.full_name, u.username 
    FROM engine_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const bindings: any[] = [];

  if (userId) {
    query += " AND s.user_id = ?";
    bindings.push(parseInt(userId));
  }

  if (status) {
    query += " AND s.status = ?";
    bindings.push(status);
  }

  if (osNumber) {
    query += " AND s.os_number LIKE ?";
    bindings.push(`%${osNumber}%`);
  }

  if (engineModel) {
    query += " AND s.engine_model LIKE ?";
    bindings.push(`%${engineModel}%`);
  }

  query += " ORDER BY s.started_at DESC";

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all();

  return c.json(results);
});

// Admin: Export to Excel
app.get("/api/admin/export", authMiddleware, adminMiddleware, async (c) => {
  try {
    const { results: sessions } = await c.env.DB.prepare(`
      SELECT s.*, u.full_name, u.username 
      FROM engine_sessions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.started_at DESC
    `).all();

    const data = [];

    for (const session of sessions as any[]) {
      const { results: pauses } = await c.env.DB.prepare(
        "SELECT * FROM pauses WHERE session_id = ? ORDER BY paused_at ASC"
      ).bind(session.id).all();

      const pauseDetails = pauses.map((p: any) => p.observation).join("; ");
      const pauseCount = pauses.length;

      // Calculate seconds too for precision
      const totalMinutes = session.total_time_seconds ? Math.floor(session.total_time_seconds / 60) : 0;
      const totalSeconds = session.total_time_seconds || 0;

      data.push({
        "Usuário": session.full_name,
        "Nome de Usuário": session.username,
        "O.S.": session.os_number,
        "Modelo do Motor": session.engine_model,
        "Data de Início": new Date(session.started_at).toLocaleDateString('pt-BR'),
        "Hora de Início": new Date(session.started_at).toLocaleTimeString('pt-BR'),
        "Hora de Finalização": session.finished_at ? new Date(session.finished_at).toLocaleTimeString('pt-BR') : "-",
        "Tempo Total (min)": totalMinutes,
        "Tempo Total (seg)": totalSeconds,
        "Status": session.status === 'finished' ? 'Finalizado' : session.status === 'paused' ? 'Pausado' : 'Em Andamento',
        "Quantidade de Pausas": pauseCount,
        "Observações": pauseDetails || "-",
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cronometragens");

    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="cronometragens-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    return c.json({ error: "Erro ao exportar dados" }, 500);
  }
});

// Admin: Delete user
app.delete("/api/users/:id", authMiddleware, adminMiddleware, async (c) => {
  try {
    const userId = parseInt(c.req.param("id"));
    const { admin_pin } = await c.req.json();

    // Get user to check if they're an admin
    const userToDelete = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).bind(userId).first() as UserRow | null;

    if (!userToDelete) {
      return c.json({ error: "Usuário não encontrado" }, 404);
    }

    // If deleting an admin, require PIN verification
    if (userToDelete.is_admin && admin_pin !== "2233") {
      return c.json({ error: "PIN administrativo inválido" }, 403);
    }

    // Delete user
    await c.env.DB.prepare(
      "DELETE FROM users WHERE id = ?"
    ).bind(userId).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Erro ao excluir usuário" }, 500);
  }
});

export default app;
