import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create PostgreSQL database connection
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });

// No need for manual table creation as we'll use Drizzle migrations