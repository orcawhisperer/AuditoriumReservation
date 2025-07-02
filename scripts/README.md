# BaazCine Scripts

This folder contains essential scripts for managing the BaazCine application.

## Available Scripts

### Database Management
- **`init-db.js`** - Initialize SQLite database with schema and admin user
- **`sqlite-push.ts`** - Push schema changes directly to database (development)
- **`migrate-sqlite.ts`** - Apply incremental migrations to SQLite database

### Deployment & Operations
- **`deploy-vps.sh`** - Automated VPS deployment script
- **`backup.sh`** - Database backup script
- **`monitor-health.sh`** - Server health monitoring script

### Configuration
- **`nginx-sample.conf`** - Sample Nginx configuration for reverse proxy

## Usage

Most scripts should be run through the main `manage.sh` script in the project root:

```bash
# Initialize database
./manage.sh init-db

# Push schema changes (development)
./manage.sh push-schema

# Run migrations
./manage.sh migrate

# Create database backup
./manage.sh backup
```

For direct script execution:
```bash
# VPS deployment
./scripts/deploy-vps.sh

# Health monitoring
./scripts/monitor-health.sh
```

## Script Dependencies

These scripts require:
- Node.js 18+
- npm packages installed
- SQLite database file in project root
- PM2 (for deployment scripts)