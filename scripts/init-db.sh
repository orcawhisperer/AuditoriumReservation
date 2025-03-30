#!/bin/bash
# Direct SQL-based database initialization script

echo "Initializing Shahbaaz Auditorium database..."

# Check if required environment variables are set
if [ -z "$PGHOST" ] || [ -z "$PGUSER" ] || [ -z "$PGDATABASE" ]; then
  echo "Error: Database environment variables not set."
  echo "Required variables: PGHOST, PGUSER, PGDATABASE, PGPASSWORD"
  exit 1
fi

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE"; then
    echo "PostgreSQL is ready!"
    break
  fi
  
  if [ $i -eq 30 ]; then
    echo "Error: PostgreSQL is not ready after 30 attempts. Giving up."
    exit 1
  fi
  
  echo "Waiting for PostgreSQL to be ready... (attempt $i/30)"
  sleep 1
done

# Function to execute SQL query
execute_query() {
  PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "$1"
  return $?
}

# Check if users table exists
echo "Checking if tables exist..."
if ! execute_query "SELECT 1 FROM users LIMIT 1" &>/dev/null; then
  echo "Creating tables..."
  
  # Create users table
  execute_query "
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
  " || exit 1
  echo "- Users table created"
  
  # Create shows table
  execute_query "
    CREATE TABLE IF NOT EXISTS shows (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date TIMESTAMP WITH TIME ZONE NOT NULL,
      poster TEXT,
      price REAL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  " || exit 1
  echo "- Shows table created"
  
  # Create reservations table
  execute_query "
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      show_id INTEGER NOT NULL REFERENCES shows(id),
      seat_numbers TEXT[] NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  " || exit 1
  echo "- Reservations table created"
else
  echo "Tables already exist."
fi

# Check if admin user exists
ADMIN_COUNT=$(execute_query "SELECT COUNT(*) FROM users WHERE username = 'admin';" | grep -Eo '[0-9]+')
if [ "$ADMIN_COUNT" = "0" ]; then
  echo "Creating admin user..."
  
  # Hash the admin password using PostgreSQL's built-in functions
  # This is not ideal, but works for initialization
  execute_query "
    INSERT INTO users (username, password, is_admin, seat_limit)
    VALUES ('admin', '\$2b\$10\$933ZXqgdwpY9VKPuECgTCefCAwDrOxrXSvNhkG7uxpnVIFikCpgTC', true, null);
  " || exit 1
  echo "Admin user created with default credentials: admin/adminpass"
else
  echo "Admin user already exists."
fi

echo "Database initialization completed successfully!"
exit 0