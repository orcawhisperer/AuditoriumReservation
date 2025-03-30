# Shahbaaz Auditorium Deployment Guide

This document provides comprehensive instructions for deploying the Shahbaaz Auditorium Seat Reservation System using Docker and Docker Compose.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Management Script](#management-script)
4. [Deployment Options](#deployment-options)
5. [Database Management](#database-management)
   - [Backup and Restore](#database-backup-and-restore)
   - [Schema Migrations](#schema-migrations)
6. [Production Configuration](#production-configuration)
7. [SSL Configuration](#ssl-configuration)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker (20.10.x or higher)
- Docker Compose (2.x or higher)
- Git (for cloning the repository)

## Quick Start

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. Use the management script to start the application:
   ```bash
   ./manage.sh start
   ```

4. Access the application at `http://localhost:5000`

## Management Script

The application includes a comprehensive management script (`manage.sh`) that simplifies common operations:

```bash
# View available commands
./manage.sh help

# Start in development mode
./manage.sh start

# Start in production mode
./manage.sh start:prod

# View application status
./manage.sh status

# View logs
./manage.sh logs

# Stop the application
./manage.sh stop

# Create a database backup
./manage.sh backup

# List available backups
./manage.sh list-backups

# Restore from a backup
./manage.sh restore backups/shahbaaz_backup_20250330_123456.sql.gz

# Create a new database migration
./manage.sh create-migration add_user_preferences

# Run database migrations
./manage.sh migrate

# Open PostgreSQL terminal
./manage.sh psql

# Open a shell in a container
./manage.sh shell:app
```

## Deployment Options

### Development Deployment

```bash
./manage.sh start
```

This deploys the application with:
- Hot reloading for development
- Application accessible at `http://localhost:5000`
- PostgreSQL database with persistent storage

### Production Deployment

```bash
./manage.sh start:prod
```

This deploys the application with:
- Optimized production build
- Nginx as a reverse proxy
- Proper container health checks
- Log rotation
- Application accessible at `http://localhost` (or configured domain)

## Database Backup and Restore

### Creating Backups

```bash
# Using the management script (recommended)
./manage.sh backup

# Manual backup
docker compose exec postgres pg_dump -U postgres -d shahbaaz_auditorium | gzip > backups/manual_backup.sql.gz
```

Backups are stored in the `backups/` directory with timestamps.

### Listing Backups

```bash
./manage.sh list-backups
```

### Restoring from Backup

```bash
# Using the management script (recommended)
./manage.sh restore backups/shahbaaz_backup_20250330_123456.sql.gz

# Manual restore
gunzip -c backups/backup_file.sql.gz | docker compose exec -T postgres psql -U postgres -d shahbaaz_auditorium
```

## Production Configuration

For production deployment, update the `.env` file with secure credentials:

```
# Production Database Configuration
POSTGRES_USER=production_user
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=shahbaaz_auditorium_prod
SESSION_SECRET=long_random_secure_string
```

## SSL Configuration

1. Place your SSL certificates in the `nginx/ssl/` directory:
   - `cert.pem`: SSL certificate
   - `key.pem`: Private key

2. Uncomment the HTTPS server block in `nginx/conf/default.conf`

3. Update the `server_name` directive with your domain name

4. Restart the application:
   ```bash
   ./manage.sh restart
   ```

## Troubleshooting

### Application not starting

1. Check container logs:
   ```bash
   ./manage.sh logs
   ```

2. Verify database connectivity:
   ```bash
   ./manage.sh psql
   ```

3. Check for port conflicts:
   ```bash
   netstat -tuln | grep 5000
   ```

### Database connection issues

1. Verify database is running:
   ```bash
   ./manage.sh status
   ```

2. Check database logs:
   ```bash
   ./manage.sh logs postgres
   ```

3. Verify database environment variables in `.env` file

### Restoring a corrupt database

If the database becomes corrupted, you can:

1. Stop the application:
   ```bash
   ./manage.sh stop
   ```

2. Clean all containers and volumes (WARNING: This will delete all data):
   ```bash
   ./manage.sh clean
   ```

3. Start fresh:
   ```bash
   ./manage.sh start
   ```

4. Restore from a backup if available:
   ```bash
   ./manage.sh restore backups/shahbaaz_backup_20250330_123456.sql.gz
   ```

## Schema Migrations

The application includes a database migration system to manage schema changes safely across deployments.

### Creating a New Migration

When you need to make schema changes (like adding a column or table), create a new migration:

```bash
./manage.sh create-migration add_user_preferences
```

This creates a new migration script in `scripts/migrations/` with a sequential version number:

```bash
scripts/migrations/002-add_user_preferences.sh
```

### Editing Migration Scripts

Edit the migration script to include your SQL changes:

```bash
#!/bin/bash
# Migration: add_user_preferences
# Migration version: 2
# Description: add_user_preferences

# Function to execute SQL query
execute_query() {
  PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "$1"
  return $?
}

# Check if this migration has already been applied
CURRENT_VERSION=$(execute_query "SELECT MAX(version) FROM schema_versions;" | sed -n 3p | tr -d ' ')

if [ "$CURRENT_VERSION" -ge "2" ]; then
  echo "Migration 002 already applied (version 2)"
  exit 0
fi

echo "Applying migration 002: add_user_preferences..."

# Apply the migration
execute_query "
  -- Add preferences JSON column to users table
  ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
" || exit 1

# Record the migration
execute_query "
  INSERT INTO schema_versions (version, description)
  VALUES (2, 'add_user_preferences');
" || exit 1

echo "Migration 002 applied successfully!"
exit 0
```

### Running Migrations

To apply all pending migrations:

```bash
./manage.sh migrate
```

The system will:
1. Check the current database version
2. Run only migrations that haven't been applied yet
3. Track applied migrations in the `schema_versions` table

### Migration in Docker Deployment

The migration system is integrated with Docker deployment:
- When containers start, migrations are automatically applied
- Each migration script safely checks if it has already been applied
- The system maintains a version history in the database

This ensures consistent database schema across all environments.