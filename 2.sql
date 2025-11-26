
CREATE TABLE engine_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  os_number TEXT NOT NULL,
  engine_model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP,
  total_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_engine_sessions_user_id ON engine_sessions(user_id);
CREATE INDEX idx_engine_sessions_status ON engine_sessions(status);
CREATE INDEX idx_engine_sessions_os_number ON engine_sessions(os_number);
