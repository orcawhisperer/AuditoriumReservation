import { sqliteTable, text, integer, primaryKey, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  seatLimit: integer("seat_limit").notNull().default(4),
  name: text("name"),
  gender: text("gender"),
  dateOfBirth: text("date_of_birth"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const shows = sqliteTable("shows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  poster: text("poster"),
  description: text("description"),
  themeColor: text("theme_color").default("#4B5320"),
  emoji: text("emoji"),
  blockedSeats: text("blocked_seats").notNull().default("[]"),
  price: integer("price").default(0),
  seatLayout: text("seat_layout").notNull().default(JSON.stringify([
    {
      section: "Balcony",
      rows: [
        { row: "P", seats: [1, 2, 3, 5, 6, 7, 9, 10, 11], total_seats: 9 },
        { row: "O", seats: [1, 2, 3, 5, 6, 7, 9, 10, 11], total_seats: 9, blocked_seats: [4, 8, 12] }
      ],
      total_section_seats: 18
    },
    {
      section: "Back",
      rows: [
        { row: "N", seats: [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16], total_seats: 12 }, // Row N missing 5-8 (server room)
        ...["M", "L", "K", "J", "I", "H", "G"].map(row => ({
          row,
          seats: Array.from({length: 16}, (_, i) => i + 1),
          total_seats: 16
        }))
      ],
      total_section_seats: 124
    },
    {
      section: "Front",
      rows: [
        ...["F", "E", "D", "C", "B", "A"].map(row => ({
          row,
          seats: Array.from({length: 18}, (_, i) => i + 1),
          total_seats: 18
        }))
      ],
      total_section_seats: 108
    }
  ])),
});

export const reservations = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  showId: integer("show_id").references(() => shows.id),
  seatNumbers: text("seat_numbers").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users, {
  isAdmin: z.literal(false).optional(),
  isEnabled: z.literal(true).optional(),
}).extend({
  name: z.string().min(1, "Name is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  dateOfBirth: z.string().refine(
    (date) => {
      const dob = new Date(date);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      return age >= 13;
    },
    { message: "Must be at least 13 years old" }
  ),
  seatLimit: z.number().int().min(1, "Minimum seat limit is 1").max(10, "Maximum seat limit is 10").default(4),
});

export const insertShowSchema = createInsertSchema(shows).extend({
  date: z.string().refine(
    (str) => new Date(str) > new Date(),
    {
      message: "Shows cannot be scheduled in the past. Please select a future date."
    }
  ).transform(str => new Date(str).toISOString()),
  poster: z.string().optional(),
  description: z.string().optional(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  emoji: z.string().optional(),
  price: z.number().int().min(0, "Price cannot be negative").default(0),
  blockedSeats: z.union([z.string(), z.array(z.string())]).transform(val => {
    // If it's already an array, validate it
    if (Array.isArray(val)) {
      // Validate each blocked seat
      val.forEach(seat => {
        if (!/^[BFR][A-P][0-9]{1,2}$/.test(seat)) {
          throw new Error(`Invalid seat format: ${seat}. Format should be like BA1, FB2, RF3, etc.`);
        }
        const [section, row, number] = [seat[0], seat[1], parseInt(seat.slice(2))];
        const isValid = (
          // Balcony section (prefix B)
          (section === 'B' && 
            ((row === 'P' || row === 'O') && [1, 2, 3, 5, 6, 7, 9, 10, 11].includes(number))
          ) ||
          // Back section (prefix R)
          (section === 'R' && (
            // Row N with server room (missing 5-8)
            (row === 'N' && [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16].includes(number)) ||
            // Rows G-M with full 16 seats
            (row >= 'G' && row <= 'M' && number >= 1 && number <= 16)
          )) ||
          // Front section (prefix F)
          (section === 'F' && (
            // Rows A-F with 18 seats
            (row >= 'A' && row <= 'F' && number >= 1 && number <= 18)
          ))
        );
        if (!isValid) {
          throw new Error(`Invalid seat number: ${seat}. This seat does not exist in the layout.`);
        }
      });
      return val;
    }

    // Otherwise treat as string
    const str = val as string;
    
    // If the string is empty or undefined, return empty array
    if (!str || str.trim() === '') {
      return [];
    }

    try {
      // Try parsing as JSON first (in case it's already JSON)
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // If not valid JSON, treat as comma-separated string
    }

    // Split by comma and clean up each seat
    const seats = str.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    // Validate each blocked seat
    seats.forEach(seat => {
      if (!/^[BFR][A-P][0-9]{1,2}$/.test(seat)) {
        throw new Error(`Invalid seat format: ${seat}. Format should be like BA1, FB2, RF3, etc.`);
      }
      const [section, row, number] = [seat[0], seat[1], parseInt(seat.slice(2))];
      const isValid = (
        // Balcony section (prefix B)
        (section === 'B' && 
          ((row === 'P' || row === 'O') && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(number))
        ) ||
        // Back section (prefix R)
        (section === 'R' && (
          // Row N with server room (missing 5-8)
          (row === 'N' && [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16].includes(number)) ||
          // Rows G-M with full 16 seats
          (row >= 'G' && row <= 'M' && number >= 1 && number <= 16)
        )) ||
        // Front section (prefix F)
        (section === 'F' && (
          // Rows A-F with 18 seats
          (row >= 'A' && row <= 'F' && number >= 1 && number <= 18)
        ))
      );
      if (!isValid) {
        throw new Error(`Invalid seat number: ${seat}. This seat does not exist in the layout.`);
      }
    });
    return seats;
  }),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  showId: true,
  seatNumbers: true,
}).extend({
  seatNumbers: z.array(z.string().regex(/^[BFR][A-P][0-9]{1,2}$/, "Invalid seat format"))
    .refine(
      (seats) => seats.every(seat => {
        const [section, row, number] = [seat[0], seat[1], parseInt(seat.slice(2))];
        
        // Check Balcony section
        if (section === 'B') {
          // Only rows O and P with specific seat numbers
          if (row === 'P' || row === 'O') {
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(number);
          }
          return false;
        }
        
        // Check Back section
        if (section === 'R') {
          // Row N with server room (missing 5-8)
          if (row === 'N') {
            return [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16].includes(number);
          }
          // Rows G-M with 16 seats each
          if (row >= 'G' && row <= 'M') {
            return number >= 1 && number <= 16;
          }
          return false;
        }
        
        // Check Front section
        if (section === 'F') {
          // Rows A-F with 18 seats each
          if (row >= 'A' && row <= 'F') {
            return number >= 1 && number <= 18;
          }
          return false;
        }
        
        return false;
      }),
      { message: "Invalid seat selection" }
    ),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Profile update schema - a simplified version for user profile updates
export const profileUpdateSchema = z.object({
  name: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
export type User = typeof users.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;