#!/bin/bash

# Exit on any error
set -e

# Function to backup the database
backup_database() {
    echo "📦 Creating database backup..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    if [ -f sqlite.db ]; then
        mkdir -p backups
        cp sqlite.db "backups/sqlite_backup_$timestamp.db"
        echo "✅ Database backed up to backups/sqlite_backup_$timestamp.db"
    else
        echo "⚠️  No database file found!"
    fi
}

# Function to check system health
check_health() {
    echo "🔍 Checking system health..."
    echo "- Node version: $(node -v)"
    echo "- NPM version: $(npm -v)"
    echo "- Disk usage: $(df -h . | tail -1 | awk '{print $5}')"
    
    if [ -f sqlite.db ]; then
        db_size=$(ls -lh sqlite.db | awk '{print $5}')
        echo "- Database size: $db_size"
    fi
    
    # Check if the application is running
    if pgrep -f "npm run (dev|start)" > /dev/null; then
        echo "✅ Application is running"
    else
        echo "❌ Application is not running"
    fi
}

# Function to clean up old files
cleanup() {
    echo "🧹 Cleaning up..."
    
    # Remove old backups (keep last 5)
    if [ -d backups ]; then
        echo "Cleaning old backups..."
        cd backups
        ls -t sqlite_backup_* | tail -n +6 | xargs rm -f 2>/dev/null || true
        cd ..
    fi
    
    # Clean npm cache
    echo "Cleaning npm cache..."
    npm cache clean --force
    
    echo "✅ Cleanup completed"
}

# Main menu
show_menu() {
    echo "🛠️  Maintenance Menu"
    echo "1) Backup database"
    echo "2) Check system health"
    echo "3) Clean up old files"
    echo "4) View application logs"
    echo "5) Exit"
    echo
    read -p "Select an option: " choice
    
    case $choice in
        1) backup_database ;;
        2) check_health ;;
        3) cleanup ;;
        4) tail -f .replit/logs/* 2>/dev/null || echo "No logs found" ;;
        5) exit 0 ;;
        *) echo "Invalid option" ;;
    esac
    
    echo
    show_menu
}

# Make scripts executable
chmod +x "$0"

# Start menu
show_menu
