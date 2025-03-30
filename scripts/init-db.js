// Database initialization script

const { db } = require('../server/db');
const { users, shows, reservations } = require('../shared/schema');
const bcrypt = require('bcrypt');

async function initializeDatabase() {
  console.log('Starting database initialization...');
  
  try {
    // Create the schema by directly creating tables
    console.log('Creating tables...');
    
    // Create users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        seat_limit INTEGER DEFAULT 8,
        is_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('- Users table created');
    
    // Create shows table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS shows (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        poster TEXT,
        price REAL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('- Shows table created');
    
    // Create reservations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        show_id INTEGER NOT NULL REFERENCES shows(id),
        seat_numbers TEXT[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('- Reservations table created');
    
    // Check if admin user exists
    const adminExists = await db.execute('SELECT COUNT(*) FROM users WHERE username = $1', ['admin']);
    
    if (parseInt(adminExists.rows[0].count) === 0) {
      console.log('Creating admin user...');
      // Create default admin user
      const hashedPassword = await bcrypt.hash('adminpass', 10);
      await db.execute(`
        INSERT INTO users (username, password, is_admin, seat_limit)
        VALUES ($1, $2, $3, $4)
      `, ['admin', hashedPassword, true, null]);
      console.log('Admin user created with default credentials: admin/adminpass');
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error during initialization:', error);
    process.exit(1);
  });