#!/bin/bash
# Run database migrations using Drizzle ORM

echo "Running database migrations using Drizzle ORM..."

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set."
  
  # Try to infer values if in Docker Compose environment
  if [ -n "$PGUSER" ] && [ -n "$PGPASSWORD" ] && [ -n "$PGDATABASE" ] && [ -n "$PGHOST" ]; then
    echo "Found PostgreSQL environment variables, constructing DATABASE_URL..."
    export DATABASE_URL="postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE"
    echo "Using DATABASE_URL: ${DATABASE_URL//$PGPASSWORD/****}"
  else
    echo "Unable to determine database connection information."
    exit 1
  fi
fi

echo "Running migrations..."
npx tsx scripts/drizzle-migrate.ts

echo "Migrations completed successfully!"
exit 0