#!/bin/bash
# Database backup script for BaazCine

# Create a timestamp for the backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
BACKUP_FILE="$BACKUP_DIR/baazcine_backup_$TIMESTAMP.sql"

# Make sure backup directory exists
mkdir -p $BACKUP_DIR

echo "Starting database backup..."

# Perform the backup
pg_dump -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$BACKUP_FILE"
if [ $? -ne 0 ]; then
  echo "Error: Database backup failed"
  exit 1
fi

# Compress the backup
gzip "$BACKUP_FILE"
if [ $? -ne 0 ]; then
  echo "Error: Compressing backup failed"
  exit 1
fi

echo "Backup completed: ${BACKUP_FILE}.gz"

# Delete backups older than 30 days
find $BACKUP_DIR -name "baazcine_backup_*.sql.gz" -type f -mtime +30 -delete
echo "Old backups cleaned up"

# List current backups
echo "Current backups:"
ls -lh $BACKUP_DIR | grep "baazcine_backup_"

exit 0