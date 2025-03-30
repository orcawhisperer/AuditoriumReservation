import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from '../shared/schema';
import path from 'path';
import fs from 'fs';
import { config } from '../server/config';

/**
 * This script handles database migrations for SQLite
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

  console.log('Applying migrations to SQLite database...');
  try {
    // Perform schema push directly using the schema definitions
    // Note: This is different from PostgreSQL's approach which uses SQL migration files
    // For SQLite, we'll just push the schema directly
    await migrate(db, { migrationsFolder: './migrations-sqlite' });
    
    console.log('SQLite database schema updated successfully.');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  }
}

main();