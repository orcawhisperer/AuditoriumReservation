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
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based authentication
- **State Management**: TanStack Query (React Query)
- **Deployment**: Docker containers for development and production

## Database Management

The project uses Drizzle ORM for database interactions and migrations. The following tools are available for database management:

### Schema Management

- The database schema is defined in `shared/schema.ts`
- When updating schemas, use Drizzle's type-safe schema definition

### Migration Scripts

Several scripts are available to help manage database migrations:

1. **Generate migrations** from schema changes:
   ```
   ./scripts/drizzle-generate.sh
   ```
   This creates SQL migration files in the `migrations` folder.

2. **Apply migrations** to the database:
   ```
   ./scripts/drizzle-run-migrations.sh
   ```
   This script intelligently detects if tables already exist and applies only incremental migrations.

3. **Push schema changes** directly to the database (for development):
   ```
   ./scripts/drizzle-db-push.sh
   ```
   This bypasses migration files and directly updates the database schema.

4. **View database** with Drizzle Studio:
   ```
   ./scripts/drizzle-studio.sh
   ```
   This launches a GUI tool for database management.

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

Use Docker for deployment:

```
docker-compose up
```

For production:

```
docker-compose -f docker-compose.prod.yml up
```

## Initial Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run migrations: `./scripts/drizzle-run-migrations.sh`
5. Start the application: `npm run dev`

## Admin Access

The system initializes with a default admin account:
- Username: `admin`
- Password: `adminpass` (change this immediately in production)

## License

MIT