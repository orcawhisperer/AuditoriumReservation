#!/bin/bash
# Database migration runner for Shahbaaz Auditorium

echo "Starting database migration process..."

# Check if required environment variables are set
if [ -z "$PGHOST" ] || [ -z "$PGUSER" ] || [ -z "$PGDATABASE" ]; then
  echo "Error: Database environment variables not set."
  echo "Required variables: PGHOST, PGUSER, PGDATABASE, PGPASSWORD"
  exit 1
fi

# Wait for PostgreSQL to be ready
echo "Checking PostgreSQL connection..."
for i in {1..10}; do
  if pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE"; then
    echo "PostgreSQL is ready!"
    break
  fi
  
  if [ $i -eq 10 ]; then
    echo "Error: PostgreSQL is not ready after 10 attempts. Giving up."
    exit 1
  fi
  
  echo "Waiting for PostgreSQL to be ready... (attempt $i/10)"
  sleep 1
done

# Function to execute SQL query
execute_query() {
  PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "$1"
  return $?
}

# Check if schema_versions table exists
if ! execute_query "SELECT 1 FROM schema_versions LIMIT 1" &>/dev/null; then
  echo "Schema versions table doesn't exist. Run init-db.sh first."
  exit 1
fi

# Get current schema version
CURRENT_VERSION=$(execute_query "SELECT MAX(version) FROM schema_versions;" | sed -n 3p | tr -d ' ')
if [ -z "$CURRENT_VERSION" ] || [ "$CURRENT_VERSION" = "NULL" ]; then
  CURRENT_VERSION=0
fi

echo "Current database schema version: $CURRENT_VERSION"

# Get all migration scripts
MIGRATION_SCRIPTS=$(find "$(dirname "$0")/migrations" -name "*.sh" | sort)

# Apply migrations in order
for SCRIPT in $MIGRATION_SCRIPTS; do
  # Extract version number from script name (assumes format NNN-description.sh)
  SCRIPT_VERSION=$(basename "$SCRIPT" | cut -d'-' -f1 | sed 's/^0*//')
  
  # Skip if already applied
  if [ "$CURRENT_VERSION" -ge "$SCRIPT_VERSION" ]; then
    echo "Skipping migration $(basename "$SCRIPT") (already applied)"
    continue
  fi
  
  echo "Applying migration $(basename "$SCRIPT")..."
  chmod +x "$SCRIPT"
  if ! "$SCRIPT"; then
    echo "Error applying migration $(basename "$SCRIPT")"
    exit 1
  fi
  
  echo "Migration $(basename "$SCRIPT") completed successfully"
done

# Display final schema version
FINAL_VERSION=$(execute_query "SELECT MAX(version) FROM schema_versions;" | sed -n 3p | tr -d ' ')
echo "Database schema is now at version $FINAL_VERSION"

echo "Migration process completed!"
exit 0