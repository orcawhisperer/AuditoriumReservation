import { InsertUser, InsertShow, InsertReservation, User, Show, Reservation } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private shows: Map<number, Show>;
  private reservations: Map<number, Reservation>;
  sessionStore: session.SessionStore;
  private currentId: { users: number; shows: number; reservations: number };

  constructor() {
    this.users = new Map();
    this.shows = new Map();
    this.reservations = new Map();
    this.currentId = { users: 1, shows: 1, reservations: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Create default admin user with hashed password
    this.initializeAdmin();
  }

  private async initializeAdmin() {
    const hashedPassword = await hashPassword("admin");
    this.createUser({
      username: "admin",
      password: hashedPassword,
      isAdmin: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, isAdmin: insertUser.isAdmin ?? false };
    this.users.set(id, user);
    return user;
  }

  async createShow(insertShow: InsertShow): Promise<Show> {
    const id = this.currentId.shows++;
    const show: Show = { ...insertShow, id };
    this.shows.set(id, show);
    return show;
  }

  async getShow(id: number): Promise<Show | undefined> {
    return this.shows.get(id);
  }

  async getShows(): Promise<Show[]> {
    return Array.from(this.shows.values());
  }

  async deleteShow(id: number): Promise<void> {
    this.shows.delete(id);
  }

  async createReservation(userId: number, insertReservation: InsertReservation): Promise<Reservation> {
    const id = this.currentId.reservations++;
    const reservation: Reservation = {
      ...insertReservation,
      id,
      userId,
      createdAt: new Date(),
    };
    this.reservations.set(id, reservation);
    return reservation;
  }

  async getReservationsByShow(showId: number): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (reservation) => reservation.showId === showId,
    );
  }

  async getReservationsByUser(userId: number): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).filter(
      (reservation) => reservation.userId === userId,
    );
  }

  async deleteReservation(id: number): Promise<void> {
    this.reservations.delete(id);
  }
}

export const storage = new MemStorage();