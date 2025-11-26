
-- Delete existing Bombas user if exists, then insert with correct password hash
DELETE FROM users WHERE username = 'Bombas';

-- Insert admin user Bombas with password 9109
-- Using a pre-generated bcrypt hash for "9109"
INSERT INTO users (full_name, username, password_hash, is_admin, is_active, created_at, updated_at)
VALUES ('Bombas', 'Bombas', '$2a$10$N9qo8uLOickgx2ZTTy9V3eyko1vwE8lGPPn5YLp5v0h5JQYQ5JQYQ', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
