import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@shared/schema';
import { config } from './config';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import fs from 'fs';

// Create SQLite database file if it doesn't exist
const dbFile = config.database.sqliteFile || 'sqlite.db';
// Make sure the directory exists
const dbDir = path.dirname(dbFile);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create SQLite database connection
const sqlite = new Database(dbFile);

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

console.log('SQLite database connected');