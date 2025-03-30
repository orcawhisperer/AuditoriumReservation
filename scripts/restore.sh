#!/bin/bash
# Database restore script for Shahbaaz Auditorium

# Check if a backup file is provided
if [ -z "$1" ]; then
  echo "Error: No backup file specified"
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh /backups | grep "shahbaaz_backup_"
  exit 1
fi

BACKUP_FILE="$1"

# Check if the backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Extract filename for logging
FILENAME=$(basename "$BACKUP_FILE")

echo "Starting database restore from $FILENAME..."
echo "WARNING: This will overwrite the current database. All existing data will be lost."
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

# Check if the file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "Uncompressing backup file..."
  gunzip -c "$BACKUP_FILE" | psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB"
  RESULT=$?
else
  # If not compressed, restore directly
  psql -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$BACKUP_FILE"
  RESULT=$?
fi

if [ $RESULT -ne 0 ]; then
  echo "Error: Database restore failed"
  exit 1
fi

echo "Database restored successfully from $FILENAME"
exit 0