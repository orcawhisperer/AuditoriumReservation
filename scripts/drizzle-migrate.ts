import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../server/db';
import * as path from 'path';
import * as url from 'url';
import fs from 'fs';
import { sql } from 'drizzle-orm';

// Convert __dirname to work with ES modules
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * This script handles database migrations for SQLite using Drizzle ORM.
 * It should be run after generating migration files with `drizzle-kit generate`.
 */
async function main() {
  console.log('Starting SQLite database migration...');
  
  try {
    // Check if tables already exist by querying for users table
    const tablesExist = await checkIfTablesExist();
    
    if (tablesExist) {
      console.log('Tables already exist, applying only incremental migrations...');
      await applyIncrementalMigrations();
    } else {
      // Run initial schema first
      const initialSchemaPath = path.join(__dirname, '../migrations-sqlite/0000_initial_schema.sql');
      
      if (fs.existsSync(initialSchemaPath)) {
        console.log('Applying initial schema...');
        const sqlContent = fs.readFileSync(initialSchemaPath, 'utf8');
        await applySqlStatements(sqlContent);
        console.log('Initial schema applied successfully!');
      } else {
        console.error('Initial schema file not found at:', initialSchemaPath);
        process.exit(1);
      }
      
      // Apply any incremental migrations
      await applyIncrementalMigrations();
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Exit successfully
    process.exit(0);
  }
}

/**
 * Checks if the database tables already exist
 */
async function checkIfTablesExist(): Promise<boolean> {
  try {
    // In SQLite we can check for table existence directly with sqlite_master
    const result = await db.query.users.findFirst();
    return result !== undefined;
  } catch (error) {
    // If we get an error, the table likely doesn't exist
    console.log('Checking tables existence - tables do not exist.');
    return false;
  }
}

/**
 * Applies SQL statements from a string
 */
async function applySqlStatements(sqlContent: string): Promise<void> {
  // Split SQL content by statement-breakpoint comments or semicolons
  const statements = sqlContent.split(/(?:-->statement-breakpoint|;)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await db.run(sql.raw(statement + ';'));
      } catch (error) {
        console.error(`Error executing SQL statement: ${statement}`);
        throw error;
      }
    }
  }
}

/**
 * Applies incremental migrations by executing SQL files numbered after 0000
 */
async function applyIncrementalMigrations(): Promise<void> {
  const migrationsFolder = path.join(__dirname, '../migrations-sqlite');
  
  if (!fs.existsSync(migrationsFolder)) {
    console.log(`Migrations folder ${migrationsFolder} does not exist. Skipping incremental migrations.`);
    return;
  }
  
  // Read all SQL files from migrations folder
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
      
      await applySqlStatements(sqlContent);
      
      console.log(`Successfully applied migration: ${file}`);
    } catch (error) {
      console.error(`Error applying migration ${file}:`, error);
      throw error;
    }
  }
  
  console.log('All incremental migrations applied successfully.');
}

main();