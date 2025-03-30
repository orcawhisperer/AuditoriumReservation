#!/bin/bash
# Database migration runner for Shahbaaz Auditorium using Drizzle ORM

echo "Starting database migration process using Drizzle ORM..."

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
for i in {1..30}; do
  if PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" &>/dev/null; then
    echo "PostgreSQL is ready!"
    break
  fi
  
  if [ $i -eq 30 ]; then
    echo "Error: PostgreSQL is not ready after 30 attempts. Giving up."
    exit 1
  fi
  
  echo "Waiting for PostgreSQL to be ready... (attempt $i/30)"
  sleep 2
done

# Function to execute SQL query
execute_query() {
  PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "$1"
  return $?
}

echo "Checking if database schema needs updates..."

# First, generate migrations if needed
echo "Generating migration files if schema has changed..."
npx drizzle-kit generate

# Then apply the migrations
echo "Applying migrations using Drizzle ORM..."
npx tsx scripts/drizzle-migrate.ts

# For backwards compatibility with previous migration system
if execute_query "SELECT 1 FROM schema_versions LIMIT 1" &>/dev/null; then
  # Update schema_versions table for legacy tracking
  CURRENT_VERSION=$(execute_query "SELECT MAX(version) FROM schema_versions;" | sed -n 3p | tr -d ' ')
  if [ -z "$CURRENT_VERSION" ] || [ "$CURRENT_VERSION" = "NULL" ]; then
    CURRENT_VERSION=0
  fi
  
  NEW_VERSION=$((CURRENT_VERSION + 1))
  
  execute_query "
    INSERT INTO schema_versions (version, description)
    VALUES ($NEW_VERSION, 'Migrated with Drizzle ORM at $(date -u +"%Y-%m-%d %H:%M:%S UTC")');
  "
  
  echo "Updated schema_versions table to version $NEW_VERSION for backward compatibility"
fi

echo "Database migration completed successfully!"
exit 0