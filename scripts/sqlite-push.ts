import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema';
import path from 'path';
import fs from 'fs';
import { config } from '../server/config';

/**
 * This script creates the SQLite database schema directly
 */
async function main() {
  // Determine SQLite db file
  const dbFile = config.database.sqliteFile || 'sqlite.db';
  console.log(`Using SQLite database file: ${dbFile}`);

  // Ensure the directory exists
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create SQLite database connection
  const sqlite = new Database(dbFile);
  const db = drizzle(sqlite, { schema });

  console.log('Creating SQLite database schema...');
  try {
    // Create users table
    sqlite.exec(`
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
    `);

    // Create shows table
    sqlite.exec(`
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
    `);

    // Create reservations table
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      show_id INTEGER,
      seat_numbers TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (show_id) REFERENCES shows(id)
    );
    `);

    console.log('SQLite database schema created successfully.');
  } catch (error) {
    console.error('Error creating schema:', error);
    process.exit(1);
  }
}

main();