import { InsertUser, InsertShow, InsertReservation, User, Show, Reservation } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, shows, reservations } from "@shared/schema";

const MemoryStore = createMemoryStore(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Show operations
  createShow(show: InsertShow): Promise<Show>;
  getShow(id: number): Promise<Show | undefined>;
  getShows(): Promise<Show[]>;
  deleteShow(id: number): Promise<void>;

  // Reservation operations
  createReservation(userId: number, reservation: InsertReservation): Promise<Reservation>;
  getReservationsByShow(showId: number): Promise<Reservation[]>;
  getReservationsByUser(userId: number): Promise<Reservation[]>;
  deleteReservation(id: number): Promise<void>;

  sessionStore: session.SessionStore;
}

export class SQLiteStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Create default admin user
    this.initializeAdmin();
  }

  private async initializeAdmin() {
    const existingAdmin = await this.getUserByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await hashPassword("admin");
      await this.createUser({
        username: "admin",
        password: hashedPassword,
        isAdmin: true,
      });
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

  async createReservation(userId: number, insertReservation: InsertReservation): Promise<Reservation> {
    const result = await db.insert(reservations).values({
      ...insertReservation,
      userId,
    }).returning();
    return result[0];
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
}

export const storage = new SQLiteStorage();