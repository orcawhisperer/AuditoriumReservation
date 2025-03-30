import { InsertUser, InsertShow, InsertReservation, User, Show, Reservation } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users, shows, reservations } from '@shared/schema';
import { hashPassword } from "./utils/password";
import { config } from "./config";
import MemoryStore from "memorystore";

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
    const MemoryStoreFactory = MemoryStore(session);
    this.sessionStore = new MemoryStoreFactory({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Admin user initialization is now handled by the seed.ts module
  }

  async initializeAdmin(): Promise<void> {
    // This method is now a no-op as admin initialization is handled by the seed.ts module
    console.log('Admin initialization requested via storage - use seedDatabase() instead');
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
    // The password should already be hashed when passed to this method
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
    const adminUsername = config.admin.username;
    await db.delete(users).where(eq(users.username, adminUsername));
  }

  async createShow(insertShow: InsertShow): Promise<Show> {
    // For SQLite, store blockedSeats and seatLayout as JSON strings
    const showData = {
      ...insertShow,
      // Store as ISO string in SQLite
      date: typeof insertShow.date === 'string' ? insertShow.date : new Date(insertShow.date).toISOString(),
      // Convert array to JSON string if needed
      blockedSeats: Array.isArray(insertShow.blockedSeats) 
        ? JSON.stringify(insertShow.blockedSeats) 
        : insertShow.blockedSeats,
      // Ensure seatLayout is a string in SQLite
      seatLayout: typeof insertShow.seatLayout === 'string'
        ? insertShow.seatLayout
        : JSON.stringify(insertShow.seatLayout)
    };
    
    const result = await db.insert(shows).values(showData).returning();
    return result[0];
  }

  async getShow(id: number): Promise<Show | undefined> {
    const result = await db.select().from(shows).where(eq(shows.id, id));
    
    if (!result.length) return undefined;
    
    // Parse JSON strings from SQLite
    const show = result[0];
    try {
      if (typeof show.blockedSeats === 'string') {
        show.blockedSeats = JSON.parse(show.blockedSeats);
      }
      if (typeof show.seatLayout === 'string') {
        show.seatLayout = JSON.parse(show.seatLayout);
      }
    } catch (error) {
      console.error('Error parsing JSON fields:', error);
    }
    
    return show;
  }

  async getShows(): Promise<Show[]> {
    const results = await db.select().from(shows);
    
    // Parse JSON strings from SQLite for each show
    results.forEach(show => {
      try {
        if (typeof show.blockedSeats === 'string') {
          show.blockedSeats = JSON.parse(show.blockedSeats);
        }
        if (typeof show.seatLayout === 'string') {
          show.seatLayout = JSON.parse(show.seatLayout);
        }
      } catch (error) {
        console.error('Error parsing JSON fields:', error);
      }
    });
    
    return results;
  }

  async deleteShow(id: number): Promise<void> {
    await db.delete(shows).where(eq(shows.id, id));
  }

  async updateShow(id: number, show: InsertShow): Promise<Show> {
    // For SQLite, store blockedSeats and seatLayout as JSON strings
    const showData = {
      ...show,
      // Store as ISO string in SQLite
      date: typeof show.date === 'string' ? show.date : new Date(show.date).toISOString(),
      // Convert array to JSON string if needed
      blockedSeats: Array.isArray(show.blockedSeats) 
        ? JSON.stringify(show.blockedSeats) 
        : show.blockedSeats,
      // Ensure seatLayout is a string in SQLite
      seatLayout: typeof show.seatLayout === 'string'
        ? show.seatLayout
        : JSON.stringify(show.seatLayout)
    };
    
    const result = await db.update(shows)
      .set(showData)
      .where(eq(shows.id, id))
      .returning();
    return result[0];
  }

  async createReservation(userId: number, insertReservation: InsertReservation): Promise<Reservation> {
    // For SQLite, store seatNumbers as JSON string
    const reservationData = {
      ...insertReservation,
      userId,
      seatNumbers: Array.isArray(insertReservation.seatNumbers) 
        ? JSON.stringify(insertReservation.seatNumbers) 
        : insertReservation.seatNumbers
    };
    
    const result = await db.insert(reservations).values(reservationData).returning();
    return result[0];
  }

  async getReservations(): Promise<Reservation[]> {
    const results = await db.select().from(reservations);
    
    // Parse JSON strings from SQLite for each reservation
    results.forEach(reservation => {
      try {
        if (typeof reservation.seatNumbers === 'string') {
          reservation.seatNumbers = JSON.parse(reservation.seatNumbers);
        }
      } catch (error) {
        console.error('Error parsing seatNumbers JSON:', error);
      }
    });
    
    return results;
  }

  async getReservationsByShow(showId: number): Promise<Reservation[]> {
    const results = await db.select()
      .from(reservations)
      .where(eq(reservations.showId, showId));
    
    // Parse JSON strings from SQLite
    results.forEach(reservation => {
      try {
        if (typeof reservation.seatNumbers === 'string') {
          reservation.seatNumbers = JSON.parse(reservation.seatNumbers);
        }
      } catch (error) {
        console.error('Error parsing seatNumbers JSON:', error);
      }
    });
    
    return results;
  }

  async getReservationsByUser(userId: number): Promise<Reservation[]> {
    const results = await db.select()
      .from(reservations)
      .where(eq(reservations.userId, userId));
    
    // Parse JSON strings from SQLite
    results.forEach(reservation => {
      try {
        if (typeof reservation.seatNumbers === 'string') {
          reservation.seatNumbers = JSON.parse(reservation.seatNumbers);
        }
      } catch (error) {
        console.error('Error parsing seatNumbers JSON:', error);
      }
    });
    
    return results;
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