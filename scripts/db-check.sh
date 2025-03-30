#!/bin/bash
# Script to check database connectivity and tables

echo "Checking database connectivity..."

# Test database connection
psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1" &> /dev/null
if [ $? -ne 0 ]; then
  echo "Error: Cannot connect to the database"
  exit 1
fi

echo "Database connection successful."

# Check if tables exist
TABLES=$(psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';")

echo "Tables found in database:"
echo "$TABLES"

# Check for required tables
echo "Checking for required tables..."
for TABLE in users shows reservations; do
  if echo "$TABLES" | grep -qw "$TABLE"; then
    echo "✓ Table '$TABLE' exists"
  else
    echo "✗ Table '$TABLE' does not exist"
    MISSING_TABLES=1
  fi
done

if [ -n "$MISSING_TABLES" ]; then
  echo "Warning: Some required tables are missing. Database may need initialization."
  exit 1
fi

echo "All required tables exist."
exit 0