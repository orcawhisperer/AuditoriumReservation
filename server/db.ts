import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

// Create SQLite database connection
const sqlite = new Database("sqlite.db");
export const db = drizzle(sqlite, { schema });

// Ensure tables are created
sqlite.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  name TEXT,
  gender TEXT,
  date_of_birth TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);

// Recreate shows table with updated schema
sqlite.exec(`DROP TABLE IF EXISTS shows`);
sqlite.exec(`CREATE TABLE shows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  poster TEXT,
  description TEXT,
  theme_color TEXT DEFAULT '#4B5320',
  emoji TEXT,
  seat_layout TEXT NOT NULL DEFAULT '{
    "balcony": {"rows": ["A","B","C"], "seatsPerRow": 12},
    "middle": {"rows": ["N","M","L","K","J","I","H","G"], "seatsPerRow": 16},
    "lower": {"rows": ["F","E","D","C","B","A"], "seatsPerRow": 17}
  }'
)`);

sqlite.exec(`CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  show_id INTEGER,
  seat_numbers TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(show_id) REFERENCES shows(id)
)`);