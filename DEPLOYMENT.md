# Shahbaaz Auditorium Deployment Guide

This document provides comprehensive instructions for deploying the Shahbaaz Auditorium Seat Reservation System using Docker and Docker Compose.

**Note:** The system has been migrated from PostgreSQL to SQLite for simplified deployment. This guide has been updated to reflect these changes.

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

# Initialize the database with schema and admin user
./manage.sh init-db

# Push schema changes to SQLite database
./manage.sh push-schema

# Run SQLite migrations
./manage.sh migrate

# Start the application (in development mode)
npm run dev

# When using Docker:
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

# Docker shell access
./manage.sh shell:app
```

## Deployment Options

### Development Deployment

```bash
# Using Node.js directly
npm run dev

# Using Docker (if available)
./manage.sh start
```

This runs the application with:
- Hot reloading for development
- Application accessible at `http://localhost:5000`
- SQLite database with file persistence

### Production Deployment

```bash
# Build the production version
npm run build

# Run the production server
npm run start

# Using Docker (if available)
./manage.sh start:prod
```

This deploys the application with:
- Optimized production build
- SQLite database for simplified deployment
- Application accessible at `http://localhost:5000` or with Nginx as a reverse proxy at `http://localhost` when using Docker

## Database Backup and Restore

SQLite databases are self-contained in a single file, making backups simple and portable.

### Creating Backups

```bash
# Using the management script (if implemented)
./manage.sh backup

# Manual backup (simpler and more reliable)
cp sqlite.db backups/sqlite_backup_$(date +%Y%m%d_%H%M%S).db
```

Backups should be stored in the `backups/` directory with timestamps.

### Listing Backups

```bash
# List all SQLite backups
ls -la backups/*.db
```

### Restoring from Backup

```bash
# Using the management script (if implemented)
./manage.sh restore backups/sqlite_backup_20250330_123456.db

# Manual restore (simpler and more reliable)
cp backups/sqlite_backup_20250330_123456.db sqlite.db
```

Note: Before restoring, ensure the application is stopped to prevent data corruption.

## Production Configuration

For production deployment, update the `.env` file with secure credentials:

```
# Production Configuration
SESSION_SECRET=long_random_secure_string
SQLITE_FILE=./data/production.db    # Store database in a protected directory
```

Since we're using SQLite, database credentials are no longer needed. However, ensure the database file is stored in a secure location with proper file permissions and regular backups.

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

1. Verify the SQLite database file exists:
   ```bash
   ls -la sqlite.db
   ```

2. Check file permissions:
   ```bash
   ls -l sqlite.db
   ```

3. Verify SQLite file path in `.env` file

4. Check application logs for database-related errors:
   ```bash
   ./manage.sh logs
   ```

### Restoring a corrupt database

If the SQLite database becomes corrupted, you can:

1. Stop the application:
   ```bash
   ./manage.sh stop
   ```

2. Rename or remove the corrupted database file:
   ```bash
   mv sqlite.db sqlite.db.corrupted
   ```

3. Either restore from a backup:
   ```bash
   cp backups/sqlite_backup_20250330_123456.db sqlite.db
   ```

4. Or initialize a fresh database:
   ```bash
   ./manage.sh init-db
   ```

5. Start the application:
   ```bash
   ./manage.sh start
   ```

## Schema Migrations

The application uses Drizzle ORM for type-safe database schema management and migrations, adapted for SQLite.

### Database Schema Management

The database schema is defined in `shared/schema.ts` using Drizzle's type-safe schema definition syntax for SQLite:

```typescript
// Example schema definition
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  is_admin: integer("is_admin", { mode: "boolean" }).default(false).notNull(),
  // ... other fields
});
```

### Initializing the Database

To initialize the SQLite database with the schema and create the admin user:

```bash
./manage.sh init-db
```

This script:
1. Creates the SQLite database file if it doesn't exist
2. Applies the initial schema from `migrations-sqlite/0000_initial_schema.sql`
3. Creates the admin user if one doesn't exist

### Pushing Schema Changes

When you need to make schema changes, update the schema in `shared/schema.ts`, then push the changes to the database:

```bash
./manage.sh push-schema
```

This directly updates the SQLite database schema without creating migration files, which is suitable for development environments.

### Running Migrations

For more controlled schema changes, you can use the migration system:

```bash
./manage.sh migrate
```

This applies SQL migration files from the `migrations-sqlite/` directory, maintaining version history.

### SQLite Migration System

The SQLite migration system works differently from PostgreSQL:
- The initial schema is defined in `migrations-sqlite/0000_initial_schema.sql`
- Incremental migrations can be added as new numbered SQL files in the same directory
- The system applies migrations in numerical order
- Migration state is tracked directly in SQLite

### Backup and Restore

SQLite databases are just single files, so you can back them up with simple file operations:

```bash
# Backup the SQLite database
cp sqlite.db backups/sqlite_backup_$(date +%Y%m%d_%H%M%S).db

# Restore from backup
cp backups/sqlite_backup_20250330_123456.db sqlite.db
```

The backup process is much simpler than with PostgreSQL since the entire database is contained in one file.