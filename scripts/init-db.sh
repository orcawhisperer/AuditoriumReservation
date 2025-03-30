#!/bin/bash
# Drizzle-based database initialization script

echo "Initializing Shahbaaz Auditorium database using Drizzle ORM..."

# Check if required environment variables are set
if [ -z "$PGHOST" ] || [ -z "$PGUSER" ] || [ -z "$PGDATABASE" ]; then
  echo "Error: Database environment variables not set."
  echo "Required variables: PGHOST, PGUSER, PGDATABASE, PGPASSWORD"
  echo "Current values:"
  echo "PGHOST=$PGHOST"
  echo "PGUSER=$PGUSER"
  echo "PGDATABASE=$PGDATABASE"
  echo "PGPASSWORD=****"
  
  # Try to infer values if in Docker Compose environment
  if [ -n "$POSTGRES_USER" ] && [ -n "$POSTGRES_PASSWORD" ] && [ -n "$POSTGRES_DB" ]; then
    echo "Found Docker Compose environment variables, using those instead."
    export PGUSER=$POSTGRES_USER
    export PGPASSWORD=$POSTGRES_PASSWORD
    export PGDATABASE=$POSTGRES_DB
    export PGHOST=postgres
  else
    exit 1
  fi
fi

# Export DATABASE_URL for Drizzle ORM
export DATABASE_URL="postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
echo "Using DATABASE_URL: ${DATABASE_URL//$PGPASSWORD/****}"

# Wait for PostgreSQL to be ready
echo "Checking PostgreSQL connection to $PGHOST:$PGPORT as $PGUSER..."
for i in $(seq 1 60); do
  if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" &>/dev/null; then
    echo "PostgreSQL is ready!"
    break
  fi
  
  if [ $i -eq 60 ]; then
    echo "Error: PostgreSQL is not ready after 60 attempts. Giving up."
    exit 1
  fi
  
  echo "Waiting for PostgreSQL to be ready... (attempt $i/60)"
  sleep 2
done

# Function to execute SQL query
execute_query() {
  PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "$1"
  return $?
}

# Check if users table exists
echo "Checking if tables exist..."
if ! execute_query "SELECT 1 FROM users LIMIT 1" &>/dev/null; then
  echo "Tables don't exist. Creating schema using Drizzle ORM..."
  
  # Use Drizzle push to create the schema
  echo "Running drizzle-kit push..."
  npx drizzle-kit push:pg
  
  if [ $? -ne 0 ]; then
    echo "Error: Drizzle schema push failed. Falling back to manual SQL initialization."
    
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
        name TEXT,
        gender TEXT,
        date_of_birth TEXT,
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
        description TEXT,
        theme_color TEXT DEFAULT '#4B5320',
        emoji TEXT,
        price INTEGER DEFAULT 0,
        blocked_seats JSONB DEFAULT '[]'::jsonb,
        seat_layout JSONB DEFAULT '[]'::jsonb,
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
        seat_numbers JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    " || exit 1
    echo "- Reservations table created"
  else
    echo "Schema created successfully using Drizzle ORM!"
  fi
  
  # Create schema versions table to track migrations (for backwards compatibility)
  execute_query "
    CREATE TABLE IF NOT EXISTS schema_versions (
      version INTEGER PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      description TEXT
    );
  " || exit 1
  echo "- Schema versions table created"
  
  # Insert initial schema version if not exists
  if [ "$(execute_query "SELECT COUNT(*) FROM schema_versions;" | grep -Eo '[0-9]+')" = "0" ]; then
    execute_query "
      INSERT INTO schema_versions (version, description)
      VALUES (1, 'Initial schema with Drizzle ORM');
    " || exit 1
    echo "- Schema version set to 1"
  fi
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
    INSERT INTO users (username, password, is_admin, seat_limit, name, gender, date_of_birth)
    VALUES ('admin', '\$2b\$10\$933ZXqgdwpY9VKPuECgTCefCAwDrOxrXSvNhkG7uxpnVIFikCpgTC', true, null, 'System Administrator', 'other', '2000-01-01');
  " || exit 1
  echo "Admin user created with default credentials: admin/adminpass"
else
  echo "Admin user already exists."
fi

echo "Database initialization completed successfully!"
exit 0