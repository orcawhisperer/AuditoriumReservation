import * as path from 'path';
import * as url from 'url';
import fs from 'fs';
import BetterSQLite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Convert __dirname to work with ES modules
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * This script creates the SQLite database schema directly
 */
async function main() {
  console.log('Starting SQLite schema push...');
  
  // Get SQLite file path from environment or use default
  const dbFile = process.env.SQLITE_FILE || 'sqlite.db';
  console.log(`Using SQLite database file: ${dbFile}`);
  
  // Ensure the database directory exists
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  try {
    // Open the SQLite database with Drizzle
    const sqlite = new BetterSQLite3(dbFile);
    const db = drizzle(sqlite);
    
    // Generate migrations from schema into a temporary directory
    const migrationsFolder = path.join(__dirname, '../migrations-sqlite-temp');
    
    // Ensure migrations directory exists
    if (!fs.existsSync(migrationsFolder)) {
      fs.mkdirSync(migrationsFolder, { recursive: true });
    }
    
    // Copy the initial schema migration to the temp directory if it doesn't exist
    const initialSchemaPath = path.join(__dirname, '../migrations-sqlite/0000_initial_schema.sql');
    const tempInitialSchemaPath = path.join(migrationsFolder, '0000_initial_schema.sql');
    
    if (fs.existsSync(initialSchemaPath) && !fs.existsSync(tempInitialSchemaPath)) {
      fs.copyFileSync(initialSchemaPath, tempInitialSchemaPath);
      console.log('Copied initial schema to temporary migrations folder');
    }
    
    // Apply migrations from the temporary directory
    try {
      console.log(`Applying migrations from: ${migrationsFolder}`);
      await migrate(db, { migrationsFolder });
      console.log('Schema push completed successfully!');
    } catch (error) {
      console.error('Error applying migrations:', error);
      
      // Try the direct SQL approach as fallback
      console.log('Trying fallback method...');
      if (fs.existsSync(initialSchemaPath)) {
        const sqlContent = fs.readFileSync(initialSchemaPath, 'utf8');
        sqlite.exec(sqlContent);
        console.log('Applied schema using fallback method!');
      } else {
        throw new Error('Initial schema file not found');
      }
    }
    
    // Close the database connection
    sqlite.close();
  } catch (error) {
    console.error('Schema push failed:', error);
    process.exit(1);
  }
  
  console.log('SQLite schema push completed!');
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('Schema push script failed:', error);
  process.exit(1);
});