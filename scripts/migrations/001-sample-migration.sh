#!/bin/bash
# Sample migration script - Adds a preferences column to users table
# Migration version: 2
# Description: Add preferences column to users table

# Function to execute SQL query
execute_query() {
  PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "$1"
  return $?
}

# Check if this migration has already been applied
CURRENT_VERSION=$(execute_query "SELECT MAX(version) FROM schema_versions;" | sed -n 3p | tr -d ' ')

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