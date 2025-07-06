#!/bin/bash

# Management script for database operations and project utilities

SQLITE_FILE=${SQLITE_FILE:-sqlite.db}
BACKUP_DIR=${BACKUP_DIR:-backups}

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

function show_help() {
  echo "Usage: ./manage.sh <command>"
  echo ""
  echo "Database Commands:"
  echo "  init-db       - Initialize SQLite database with schema and admin user"
  echo "  push-schema   - Push schema changes directly to SQLite database"
  echo "  migrate       - Run SQLite migrations"
  echo "  backup        - Create SQLite database backup"
  echo "  list-backups  - List available database backups"
  echo "  restore FILE  - Restore database from backup file"
  echo ""
  echo "Helper Commands:"
  echo "  help          - Show this help message"
}

function backup_db() {
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="$BACKUP_DIR/sqlite_backup_$TIMESTAMP.db"
  
  echo "Creating backup: $BACKUP_FILE"
  if [ -f "$SQLITE_FILE" ]; then
    cp "$SQLITE_FILE" "$BACKUP_FILE"
    echo "Backup created successfully."
  else
    echo "Error: Database file ($SQLITE_FILE) does not exist."
    exit 1
  fi
}

function restore_db() {
  BACKUP_FILE="$2"
  
  if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file $BACKUP_FILE not found."
    exit 1
  fi
  
  echo "Restoring from backup: $BACKUP_FILE"
  if [ -f "$SQLITE_FILE" ]; then
    echo "Creating backup of current database before restore..."
    backup_db
  fi
  
  cp "$BACKUP_FILE" "$SQLITE_FILE"
  echo "Database restored successfully."
}

case "$1" in
  # Database commands
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
  backup)
    backup_db
    ;;
  list-backups)
    echo "Available backups:"
    ls -la $BACKUP_DIR/*.db 2>/dev/null || echo "No backups found in $BACKUP_DIR/"
    ;;
  restore)
    if [ -z "$2" ]; then
      echo "Error: Please specify a backup file to restore."
      echo "Usage: ./manage.sh restore <backup_file>"
      exit 1
    fi
    restore_db "$1" "$2"
    ;;
    
  # Help command
  help|--help|-h)
    show_help
    ;;
  *)
    echo "Unknown command: $1"
    show_help
    exit 1
    ;;
esac