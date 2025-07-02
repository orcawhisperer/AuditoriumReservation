-- SQLite initial schema for BaazCine

-- Users table
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
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Shows table
CREATE TABLE IF NOT EXISTS shows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  poster TEXT,
  description TEXT,
  theme_color TEXT DEFAULT '#4B5320',
  emoji TEXT,
  blocked_seats TEXT NOT NULL DEFAULT '[]',
  price INTEGER DEFAULT 0,
  seat_layout TEXT NOT NULL DEFAULT '{
    "sections": [
      {
        "section": "Balcony",
        "rows": [
          { "row": "C", "seats": 12, "total_seats": 12 },
          { "row": "B", "seats": 12, "total_seats": 12 },
          { "row": "A", "seats": [9, 10, 11, 12], "total_seats": 4 }
        ],
        "total_section_seats": 28
      },
      {
        "section": "Downstairs",
        "rows": [
          { "row": "N", "seats": [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16], "total_seats": 12 },
          { "row": "M", "seats": 16, "total_seats": 16 },
          { "row": "L", "seats": 16, "total_seats": 16 },
          { "row": "K", "seats": 16, "total_seats": 16 },
          { "row": "J", "seats": 16, "total_seats": 16 },
          { "row": "I", "seats": 16, "total_seats": 16 },
          { "row": "H", "seats": 16, "total_seats": 16 },
          { "row": "G", "seats": 16, "total_seats": 16 },
          { "row": "F", "seats": 18, "total_seats": 18 },
          { "row": "E", "seats": 18, "total_seats": 18 },
          { "row": "D", "seats": 18, "total_seats": 18 },
          { "row": "C", "seats": 18, "total_seats": 18 },
          { "row": "B", "seats": 18, "total_seats": 18 },
          { "row": "A", "seats": 18, "total_seats": 18 }
        ],
        "total_section_seats": 232
      }
    ]
  }'
);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  show_id INTEGER,
  seat_numbers TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (show_id) REFERENCES shows (id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations (user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_show_id ON reservations (show_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_shows_date ON shows (date);