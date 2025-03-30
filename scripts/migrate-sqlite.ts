import * as path from 'path';
import * as url from 'url';
import fs from 'fs';
import BetterSQLite3, { Database } from 'better-sqlite3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Convert __dirname to work with ES modules
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * This script handles database migrations for SQLite
 */
async function main() {
  console.log('Starting SQLite database migration...');
  
  // Get SQLite file path from environment or use default
  const dbFile = process.env.SQLITE_FILE || 'sqlite.db';
  console.log(`Using SQLite database file: ${dbFile}`);
  
  // Ensure the database directory exists
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  try {
    // Open the SQLite database
    const sqlite = new BetterSQLite3(dbFile);
    
    // Check if tables already exist by querying for users table
    let tablesExist = false;
    try {
      const result = sqlite.prepare('SELECT 1 FROM users LIMIT 1').get();
      tablesExist = !!result;
    } catch (error) {
      // Table doesn't exist
    }
    
    if (tablesExist) {
      console.log('Tables already exist, applying only incremental migrations...');
      await applyIncrementalMigrations(sqlite);
    } else {
      // Run initial schema first
      const initialSchemaPath = path.join(__dirname, '../migrations-sqlite/0000_initial_schema.sql');
      
      if (fs.existsSync(initialSchemaPath)) {
        console.log('Applying initial schema...');
        const sqlContent = fs.readFileSync(initialSchemaPath, 'utf8');
        sqlite.exec(sqlContent);
        console.log('Initial schema applied successfully!');
      } else {
        console.error('Initial schema file not found at:', initialSchemaPath);
        process.exit(1);
      }
      
      // Apply any incremental migrations
      await applyIncrementalMigrations(sqlite);
    }
    
    // Close the database connection
    sqlite.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
  
  console.log('SQLite migration completed successfully!');
  process.exit(0);
}

/**
 * Applies incremental migrations from numbered files
 */
async function applyIncrementalMigrations(sqlite: Database): Promise<void> {
  const migrationsFolder = path.join(__dirname, '../migrations-sqlite');
  
  if (!fs.existsSync(migrationsFolder)) {
    console.log(`Migrations folder ${migrationsFolder} does not exist. Skipping incremental migrations.`);
    return;
  }
  
  // Read all SQL files from migrations folder (except the initial schema)
  const migrationFiles = fs.readdirSync(migrationsFolder)
    .filter(file => file.endsWith('.sql') && !file.startsWith('0000_'))
    .sort();
  
  if (migrationFiles.length === 0) {
    console.log('No incremental migrations found.');
    return;
  }
  
  console.log(`Found ${migrationFiles.length} incremental migrations to apply.`);
  
  for (const file of migrationFiles) {
    try {
      console.log(`Applying migration: ${file}`);
      const filePath = path.join(migrationsFolder, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Split SQL content by statement-breakpoint comments or semicolons
      const statements = sqlContent.split(/(?:-->statement-breakpoint|;)/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            sqlite.exec(statement + ';');
          } catch (error) {
            console.error(`Error executing SQL statement: ${statement}`);
            throw error;
          }
        }
      }
      
      console.log(`Successfully applied migration: ${file}`);
    } catch (error) {
      console.error(`Error applying migration ${file}:`, error);
      throw error;
    }
  }
  
  console.log('All incremental migrations applied successfully.');
}

// Run the main function
main().catch(error => {
  console.error('Migration script failed:', error);
  process.exit(1);
});