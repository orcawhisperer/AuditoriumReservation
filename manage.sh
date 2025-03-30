#!/bin/bash

# Management script for database operations and project utilities

function show_help() {
  echo "Usage: ./manage.sh <command>"
  echo ""
  echo "Available commands:"
  echo "  init-db     - Initialize SQLite database with schema and admin user"
  echo "  push-schema - Push schema changes directly to SQLite database"
  echo "  migrate     - Run SQLite migrations"
  echo "  help        - Show this help message"
}

case "$1" in
  init-db)
    echo "Initializing SQLite database..."
    npx tsx scripts/init-db.js
    ;;
  push-schema)
    echo "Pushing schema to SQLite database..."
    npx tsx scripts/sqlite-push.ts
    ;;
  migrate)
    echo "Running SQLite migrations..."
    npx tsx scripts/migrate-sqlite.ts
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo "Unknown command: $1"
    show_help
    exit 1
    ;;
esac