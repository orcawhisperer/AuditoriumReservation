# BaazCine Deployment Guide

This document provides comprehensive instructions for deploying the BaazCine Seat Reservation System on a VPS (Virtual Private Server) without Docker.

**Note:** The system uses SQLite for simplified deployment. This guide has been updated to reflect direct VPS deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Management Script](#management-script)
4. [Deployment Options](#deployment-options)
5. [Database Management](#database-management)
   - [Backup and Restore](#database-backup-and-restore)
   - [Schema Migrations](#schema-migrations)
6. [Production Configuration](#production-configuration)
7. [SSL Configuration with Nginx](#ssl-configuration-with-nginx)
8. [Process Management with PM2](#process-management-with-pm2)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js (v18.x or higher)
- npm (v9.x or higher)
- Git (for cloning the repository)
- Nginx (for production deployments)
- PM2 (for process management in production)

## Quick Start

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Initialize the database:
   ```bash
   ./manage.sh init-db
   ```

5. Start the application in development mode:
   ```bash
   npm run dev
   ```

6. Access the application at `http://localhost:5000`

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

# Backup database
./manage.sh backup

# List available backups
./manage.sh list-backups

# Restore database from backup
./manage.sh restore backups/sqlite_backup_YYYYMMDD_HHMMSS.db
```

## Deployment Options

### Development Deployment

```bash
# Install dependencies (if not already installed)
npm install

# Start development server
npm run dev
```

This runs the application with:
- Hot reloading for development
- Application accessible at `http://localhost:5000`
- SQLite database with file persistence

### Production Deployment

For production deployment on a VPS, follow these steps:

1. Set up your server with Node.js 18+
   ```bash
   # Example for Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. Install PM2 globally
   ```bash
   sudo npm install -g pm2
   ```

3. Clone your repository
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

4. Install dependencies
   ```bash
   npm install
   ```

5. Create/update environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   nano .env
   ```

6. Build the application
   ```bash
   npm run build
   ```

7. Initialize the database
   ```bash
   ./manage.sh init-db
   ```

8. Start the application with PM2
   ```bash
   pm2 start npm --name "shahbaaz-auditorium" -- start
   ```

9. Set up PM2 to start on system boot
   ```bash
   pm2 startup
   pm2 save
   ```

10. Set up Nginx as a reverse proxy (see Nginx Configuration section)

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

## Nginx Configuration

Create an Nginx configuration file for your application:

```bash
sudo nano /etc/nginx/sites-available/shahbaaz-auditorium
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Add custom error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/shahbaaz-auditorium /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## SSL Configuration with Let's Encrypt

For production environments, using Let's Encrypt to secure your site is recommended:

1. Install Certbot:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. Obtain and install SSL certificate:
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. Set up auto-renewal:
   ```bash
   sudo systemctl status certbot.timer  # Verify timer is active
   ```

## Process Management with PM2

PM2 is used to ensure your application stays running and restarts automatically:

```bash
# List running applications
pm2 list

# View application logs
pm2 logs baazcine

# Restart application
pm2 restart baazcine

# Stop application
pm2 stop baazcine

# Start application if stopped
pm2 start baazcine

# Set up PM2 to start on system boot
pm2 startup
pm2 save
```

## Troubleshooting

### Application not starting

1. Check PM2 logs:
   ```bash
   pm2 logs baazcine
   ```

2. Check for port conflicts:
   ```bash
   sudo netstat -tulpn | grep 5000
   ```

3. Verify Node.js version:
   ```bash
   node -v  # Should be v18.x or higher
   ```

4. Check if the build was successful:
   ```bash
   ls -la dist/
   ```

### Database connection issues

1. Verify the SQLite database file exists:
   ```bash
   ls -la sqlite.db
   ```

2. Check file permissions:
   ```bash
   ls -l sqlite.db
   sudo chown -R $USER:$USER .  # Fix permissions if needed
   ```

3. Verify SQLite file path in `.env` file:
   ```bash
   grep SQLITE_FILE .env
   ```

4. Check PM2 logs for database errors:
   ```bash
   pm2 logs baazcine --lines 100
   ```

### Nginx issues

1. Check Nginx configuration:
   ```bash
   sudo nginx -t
   ```

2. Check Nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. Verify Nginx is running:
   ```bash
   sudo systemctl status nginx
   ```

### Restoring a corrupt database

If the SQLite database becomes corrupted:

1. Stop the application:
   ```bash
   pm2 stop shahbaaz-auditorium
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
   pm2 start shahbaaz-auditorium
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