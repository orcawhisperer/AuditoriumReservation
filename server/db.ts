import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import { config } from './config';

// Create PostgreSQL database connection with retries
const client = postgres(config.database.url, {
  host: '0.0.0.0',
  max: 1,
  connect_timeout: 10,
  idle_timeout: 20
});
export const db = drizzle(client, { schema });

console.log('PostgreSQL database connected');