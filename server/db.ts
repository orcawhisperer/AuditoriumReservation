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

// Create shows table with updated schema
sqlite.exec(`CREATE TABLE IF NOT EXISTS shows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  poster TEXT,
  description TEXT,
  theme_color TEXT DEFAULT '#4B5320',
  emoji TEXT,
  blocked_seats TEXT NOT NULL DEFAULT '[]',
  seat_layout TEXT NOT NULL DEFAULT '${JSON.stringify([
    {
      section: "Balcony",
      prefix: "B",
      rows: [
        { row: "C", seats: Array.from({length: 12}, (_, i) => i + 1), total_seats: 12 },
        { row: "B", seats: Array.from({length: 12}, (_, i) => i + 1), total_seats: 12 },
        { row: "A", seats: [9, 10, 11, 12], total_seats: 4 }
      ],
      total_section_seats: 28
    },
    {
      section: "Downstairs",
      prefix: "D",
      rows: [
        { row: "N", seats: [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16], total_seats: 12 },
        ...["M", "L", "K", "J", "I", "H", "G"].map(row => ({
          row,
          seats: Array.from({length: 16}, (_, i) => i + 1),
          total_seats: 16
        })),
        ...["F", "E", "D", "C", "B", "A"].map(row => ({
          row,
          seats: Array.from({length: 18}, (_, i) => i + 1),
          total_seats: 18
        }))
      ],
      total_section_seats: 232
    }
  ])}'
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