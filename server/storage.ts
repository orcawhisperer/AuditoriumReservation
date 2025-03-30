import { InsertUser, InsertShow, InsertReservation, User, Show, Reservation } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, shows, reservations } from '@shared/schema';
import { hashPassword } from "./auth";
import { config } from "./config";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { isAdmin?: boolean }): Promise<User>;
  getUsers(): Promise<User[]>;
  resetUserPassword(userId: number, newPassword: string): Promise<void>;
  toggleUserStatus(userId: number, isEnabled: boolean): Promise<void>;
  toggleUserAdmin(userId: number, isAdmin: boolean): Promise<void>;
  deleteAdmin(): Promise<void>;
  initializeAdmin(): Promise<void>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Show operations
  createShow(show: InsertShow): Promise<Show>;
  getShow(id: number): Promise<Show | undefined>;
  getShows(): Promise<Show[]>;
  deleteShow(id: number): Promise<void>;
  updateShow(id: number, show: InsertShow): Promise<Show>;

  // Reservation operations
  createReservation(userId: number, reservation: InsertReservation): Promise<Reservation>;
  getReservations(): Promise<Reservation[]>;
  getReservationsByShow(showId: number): Promise<Reservation[]>;
  getReservationsByUser(userId: number): Promise<Reservation[]>;
  deleteReservation(id: number): Promise<void>;

  sessionStore: session.Store;
}

export class SQLiteStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize the admin user asynchronously
    this.initializeAdmin().catch(error => {
      console.error('Failed to initialize admin user during startup:', error);
    });
  }

  async initializeAdmin(): Promise<void> {
    const adminUsername = config.adminUsername;
    const adminPassword = config.adminPassword;

    try {
      // Check if admin exists
      const existingAdmin = await this.getUserByUsername(adminUsername);

      if (!existingAdmin) {
        console.log(`Creating new admin user '${adminUsername}'`);
        const hashedPassword = await hashPassword(adminPassword);
        const result = await db.insert(users).values({
          username: adminUsername,
          password: hashedPassword,
          isAdmin: true,
          isEnabled: true,
          name: 'System Administrator',
          gender: 'other',
          dateOfBirth: new Date().toISOString(),
        }).returning();

        if (result[0]) {
          console.log(`Admin user '${adminUsername}' created successfully`);
          
          // Security warning for default credentials
          if (adminUsername === 'admin' && adminPassword === 'admin') {
            console.warn('⚠️ WARNING: Using default admin credentials is a security risk!');
            console.warn('Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables.');
          }
        } else {
          console.error('Failed to create admin user');
        }
      } else {
        console.log(`Admin user '${adminUsername}' already exists`);
      }
    } catch (error) {
      console.error('Error in initializeAdmin:', error);
      throw error; // Re-throw to handle it in the calling function
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      isAdmin: insertUser.isAdmin ?? false,
    }).returning();
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async resetUserPassword(userId: number, newPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId));
  }

  async toggleUserStatus(userId: number, isEnabled: boolean): Promise<void> {
    await db.update(users)
      .set({ isEnabled })
      .where(eq(users.id, userId));
  }

  async toggleUserAdmin(userId: number, isAdmin: boolean): Promise<void> {
    await db.update(users)
      .set({ isAdmin })
      .where(eq(users.id, userId));
  }

  async deleteAdmin(): Promise<void> {
    const adminUsername = config.adminUsername;
    await db.delete(users).where(eq(users.username, adminUsername));
  }

  async createShow(insertShow: InsertShow): Promise<Show> {
    const result = await db.insert(shows).values(insertShow).returning();
    return result[0];
  }

  async getShow(id: number): Promise<Show | undefined> {
    const result = await db.select().from(shows).where(eq(shows.id, id));
    return result[0];
  }

  async getShows(): Promise<Show[]> {
    return await db.select().from(shows);
  }

  async deleteShow(id: number): Promise<void> {
    await db.delete(shows).where(eq(shows.id, id));
  }

  async updateShow(id: number, show: InsertShow): Promise<Show> {
    const result = await db.update(shows)
      .set(show)
      .where(eq(shows.id, id))
      .returning();
    return result[0];
  }

  async createReservation(userId: number, insertReservation: InsertReservation): Promise<Reservation> {
    const result = await db.insert(reservations).values({
      ...insertReservation,
      userId,
    }).returning();
    return result[0];
  }

  async getReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations);
  }

  async getReservationsByShow(showId: number): Promise<Reservation[]> {
    return await db.select()
      .from(reservations)
      .where(eq(reservations.showId, showId));
  }

  async getReservationsByUser(userId: number): Promise<Reservation[]> {
    return await db.select()
      .from(reservations)
      .where(eq(reservations.userId, userId));
  }

  async deleteReservation(id: number): Promise<void> {
    await db.delete(reservations).where(eq(reservations.id, id));
  }
  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new SQLiteStorage();