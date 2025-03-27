import BetterSqlite3 from 'better-sqlite3';
const db = new BetterSqlite3('sqlite.db');

console.log('Adding seat_limit column to users table...');

try {
  // Check if the column exists
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const hasSeatLimit = columns.some(col => col.name === 'seat_limit');
  
  if (!hasSeatLimit) {
    console.log('Column does not exist, adding it now...');
    db.prepare("ALTER TABLE users ADD COLUMN seat_limit INTEGER NOT NULL DEFAULT 4").run();
    console.log('Column added successfully!');
  } else {
    console.log('Column already exists, no action needed.');
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}