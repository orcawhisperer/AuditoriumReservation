/**
 * Database seeding module for initializing the database with required data
 */
import { db } from "../db";
import { users } from "@shared/schema";
import { hashPassword, generateSecurePassword } from "./password";
import { config } from "../config";
import { eq } from "drizzle-orm";
import { log } from "../vite";

/**
 * Initialize admin user
 * 
 * This creates the admin user if it doesn't exist, or verifies that at least
 * one admin user exists in the database.
 * 
 * @returns Promise resolving when initialization is complete
 */
export async function initializeAdmin(): Promise<void> {
  // Check if admin user already exists
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.isAdmin, true))
    .limit(1);

  if (existingAdmin) {
    log(`Admin user '${existingAdmin.username}' already exists`, "seed");
    return;
  }

  // If no admin exists, create one with the configured or generated credentials
  const username = config.admin.username;
  // Use configured password or generate a secure one
  const password = config.admin.password || generateSecurePassword();

  // Hash the password before storing
  const hashedPassword = await hashPassword(password);

  // Insert the admin user
  await db.insert(users).values({
    username,
    password: hashedPassword,
    seatLimit: 1000, // Admins have high seat limits
    isAdmin: true,
    isEnabled: true,
    name: 'System Administrator',
    gender: 'other',
    dateOfBirth: new Date().toISOString()
  });

  log(`Created admin user '${username}'`, "seed");
  
  // If using generated password, display it once
  if (!config.admin.password) {
    log(`Generated secure password for admin: ${password}`, "seed");
    log("Please save this password as it will not be shown again!", "seed");
  }
}

/**
 * Initialize the database with required data
 * @returns Promise resolving when seeding is complete
 */
export async function seedDatabase(): Promise<void> {
  // Initialize admin user
  await initializeAdmin();
  
  // Add any other required seeding operations here
  
  log("Database seeding completed", "seed");
}