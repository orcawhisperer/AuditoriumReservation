import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '../server/db';
import * as path from 'path';
import * as url from 'url';
import fs from 'fs';
import { sql } from 'drizzle-orm';

// Convert __dirname to work with ES modules
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

/**
 * This script handles database migrations using Drizzle ORM's built-in migrator.
 * It should be run after generating migration files with `drizzle-kit generate`.
 */
async function main() {
  console.log('Starting database migration...');
  
  try {
    // Check if tables already exist by querying for users table
    const tablesExist = await checkIfTablesExist();
    
    if (tablesExist) {
      console.log('Tables already exist, applying only incremental migrations...');
      await applyIncrementalMigrations();
    } else {
      // Run full migrations from the generated migration files
      const migrationsFolder = path.join(__dirname, '../migrations');
      console.log(`Using migrations from: ${migrationsFolder}`);
      
      try {
        await migrate(db, { migrationsFolder });
        console.log('Full migration completed successfully!');
      } catch (error) {
        console.error('Full migration failed, trying incremental approach:', error);
        await applyIncrementalMigrations();
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

/**
 * Checks if the database tables already exist
 */
async function checkIfTablesExist(): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    return result[0]?.exists === true;
  } catch (error) {
    console.error('Error checking tables existence:', error);
    return false;
  }
}

/**
 * Applies incremental migrations by executing SQL files numbered after 0000
 */
async function applyIncrementalMigrations(): Promise<void> {
  const migrationsFolder = path.join(__dirname, '../migrations');
  
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
      
      // Split SQL content by statement-breakpoint comments
      const statements = sqlContent.split('-->')
        .map(s => s.replace('statement-breakpoint', '').trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          await db.execute(sql.raw(statement));
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

main();