#!/bin/bash
# Sample migration script - Adds a preferences column to users table
# Migration version: 2
# Description: Add preferences column to users table

# Function to execute SQL query
execute_query() {
  PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "$1"
  return $?
}

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

# Check if this migration has already been applied
CURRENT_VERSION=$(execute_query "SELECT MAX(version) FROM schema_versions;" | sed -n 3p | tr -d ' ')

if [ -z "$CURRENT_VERSION" ] || [ "$CURRENT_VERSION" = "NULL" ]; then
  CURRENT_VERSION=0
fi

if [ "$CURRENT_VERSION" -ge "2" ]; then
  echo "Migration 001 already applied (version 2)"
  exit 0
fi

echo "Applying migration 001: Add preferences column to users table..."

# Apply the migration
execute_query "
  ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
" || exit 1

# Record the migration
execute_query "
  INSERT INTO schema_versions (version, description)
  VALUES (2, 'Add preferences column to users table');
" || exit 1

echo "Migration 001 applied successfully!"
exit 0