import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';
import { config } from './config';

// Create PostgreSQL database connection
const client = postgres(config.database.url);
export const db = drizzle(client, { schema });

console.log('PostgreSQL database connected');