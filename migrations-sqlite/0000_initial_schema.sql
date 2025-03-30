-- Initial schema creation for SQLite
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  seat_limit INTEGER NOT NULL DEFAULT 4,
  name TEXT,
  gender TEXT,
  date_of_birth TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  poster TEXT,
  description TEXT,
  theme_color TEXT DEFAULT "#4B5320",
  emoji TEXT,
  blocked_seats TEXT NOT NULL DEFAULT "[]",
  price INTEGER DEFAULT 0,
  seat_layout TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  show_id INTEGER,
  seat_numbers TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (show_id) REFERENCES shows(id)
);