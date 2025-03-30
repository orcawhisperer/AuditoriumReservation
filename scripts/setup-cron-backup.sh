#!/bin/bash

# Script to set up automatic database backups with cron
# This script creates a cron job that runs daily backups

# Exit on error
set -e

# Get the absolute path to the project directory
PROJECT_DIR=$(pwd)

# Backup script content
BACKUP_SCRIPT="#!/bin/bash
cd ${PROJECT_DIR}
./manage.sh backup

# Cleanup old backups (keep last 30 days)
find ${PROJECT_DIR}/backups -name \"sqlite_backup_*.db\" -type f -mtime +30 -delete
"

# Create the backup script
echo "Creating daily backup script..."
DAILY_BACKUP_SCRIPT="${PROJECT_DIR}/scripts/daily-backup.sh"
echo "$BACKUP_SCRIPT" > "$DAILY_BACKUP_SCRIPT"
chmod +x "$DAILY_BACKUP_SCRIPT"

# Add cron job to run daily at 2 AM
echo "Setting up cron job for daily backups at 2 AM..."
(crontab -l 2>/dev/null || echo "") | grep -v "$DAILY_BACKUP_SCRIPT" | { cat; echo "0 2 * * * $DAILY_BACKUP_SCRIPT"; } | crontab -

# Verify cron job was added
echo "Verifying cron job installation..."
CRON_CHECK=$(crontab -l | grep -c "$DAILY_BACKUP_SCRIPT" || true)

if [ "$CRON_CHECK" -ge 1 ]; then
    echo "Success: Daily backup cron job installed!"
    echo "The database will be backed up daily at 2 AM."
    echo "Backups older than 30 days will be automatically removed."
    echo "Backup script location: $DAILY_BACKUP_SCRIPT"
else
    echo "Error: Failed to install cron job. Please check your cron configuration."
    exit 1
fi