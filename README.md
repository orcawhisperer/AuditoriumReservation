# Shahbaaz Auditorium - Reservation System

A military-themed auditorium reservation system providing a comprehensive, user-friendly platform for event management and precise seat allocation.

## Features

- User management with admin privileges
- Show/event management with pricing
- Seat reservation and tracking
- Multi-language support (English and Hindi)
- Responsive design for all devices
- Role-based access control

## Technical Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Express.js
- **Database**: SQLite with Drizzle ORM (with PostgreSQL compatibility)
- **Authentication**: Passport.js with session-based authentication
- **State Management**: TanStack Query (React Query)
- **Deployment**: Direct VPS deployment with PM2 and Nginx

## Database Management

The project uses Drizzle ORM for database interactions and migrations. While the system was originally designed with PostgreSQL, it has been migrated to use SQLite for simpler deployment and portability.

### Schema Management

- The database schema is defined in `shared/schema.ts`
- When updating schemas, use Drizzle's type-safe schema definition

### Database Management Scripts

Several scripts are available to help manage the SQLite database. You can use our `manage.sh` utility:

1. **Initialize the database** with schema and admin user:
   ```
   ./manage.sh init-db
   ```
   This creates the database file, applies the initial schema, and creates an admin user if one doesn't exist.

2. **Push schema changes** directly to the database (for development):
   ```
   ./manage.sh push-schema
   ```
   This bypasses migration files and directly updates the database schema.

3. **Run migrations** on the SQLite database:
   ```
   ./manage.sh migrate
   ```
   This applies SQL migration files from the `migrations-sqlite` folder.

4. **View all available commands**:
   ```
   ./manage.sh help
   ```

### Migration System Architecture

The migration system is designed to work in both new and existing environments:

1. For new databases, it applies the full initial migration
2. For existing databases, it detects tables and only applies incremental migrations
3. Migrations are applied in order by file name (0000_, 0001_, etc.)

## Development

To start the development server:

```
npm run dev
```

This starts both the Express backend server and the Vite development server for the frontend.

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

Quick production deployment on a VPS:

```bash
# Build and start the production application
npm run build
npm start

# For automated deployment
./scripts/deploy-vps.sh

# Setting up with PM2 for process management
pm2 start npm --name "shahbaaz-auditorium" -- start
pm2 startup
pm2 save
```

## Initial Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Initialize the database: `./manage.sh init-db`
5. Start the application: `npm run dev`

## Admin Access

The system initializes with a default admin account:
- Username: `admin`
- Password: `adminpass` (change this immediately in production)

## License

MIT