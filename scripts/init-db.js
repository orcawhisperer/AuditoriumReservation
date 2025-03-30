import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from '../server/config.js';
import { generateSecurePassword, hashPassword } from '../server/utils/password.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function initializeDatabase() {
  // Get SQLite file path
  const dbFile = config.database.sqliteFile || 'sqlite.db';
  console.log(`Using SQLite database file: ${dbFile}`);

  // Ensure the directory exists
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create the database file if it doesn't exist
  const sqlite = new Database(dbFile);

  // Execute initial schema SQL
  const schemaPath = path.join(__dirname, '../migrations-sqlite/0000_initial_schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    sqlite.exec(schemaSql);
    console.log('Applied initial schema');
  } else {
    console.error('Initial schema SQL file not found');
    process.exit(1);
  }

  // Create admin user if not exists
  const adminExists = sqlite.prepare('SELECT 1 FROM users WHERE username = ?').get(config.admin.username);
  
  if (!adminExists) {
    const password = config.admin.password || generateSecurePassword(12);
    const hashedPassword = await hashPassword(password);
    
    sqlite.prepare(
      'INSERT INTO users (username, password, is_admin, is_enabled, name) VALUES (?, ?, 1, 1, ?)'
    ).run(config.admin.username, hashedPassword, 'Administrator');
    
    console.log(`Created admin user: ${config.admin.username}`);
    if (!config.admin.password) {
      console.log(`Generated admin password: ${password}`);
      console.log('Please save this password as it will not be shown again.');
    }
  } else {
    console.log('Admin user already exists');
  }

  console.log('Database initialization complete');
}

initializeDatabase().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});