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
        { row: "A", seats: Array.from({length: 6}, (_, i) => i + 1), total_seats: 6 },
        { row: "B", seats: Array.from({length: 6}, (_, i) => i + 1), total_seats: 6 },
        { row: "C", seats: Array.from({length: 6}, (_, i) => i + 1), total_seats: 6 }
      ],
      total_section_seats: 18
    },
    {
      section: "Back Section",
      rows: [
        ...["I", "H", "G", "F", "E", "D", "C", "B", "A"].map(row => {
          // Central gap dividing row into two sections of seats
          const leftSeats = Array.from({length: 7}, (_, i) => i + 1);
          const rightSeats = Array.from({length: 7}, (_, i) => i + 8);
          return {
            row,
            seats: [...leftSeats, ...rightSeats],
            total_seats: 14
          };
        })
      ],
      total_section_seats: 126 // 9 rows * 14 seats = 126 (slight adjustment for accurate layout)
    },
    {
      section: "Front Section",
      rows: [
        ...["R", "Q", "P", "N", "M", "L"].map(row => {
          // Central gap dividing row into two sections of seats
          const leftSeats = Array.from({length: 9}, (_, i) => i + 1);
          const rightSeats = Array.from({length: 9}, (_, i) => i + 10);
          return {
            row,
            seats: [...leftSeats, ...rightSeats],
            total_seats: 18
          };
        })
      ],
      total_section_seats: 108 // 6 rows * 18 seats = 108
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
        if (!/^[BFR][A-RI][0-9]{1,2}$/.test(seat)) {
          throw new Error(`Invalid seat format: ${seat}. Format should be like BA1, FB2, RC3, etc.`);
        }
        const [section, row, number] = [seat[0], seat[1], parseInt(seat.slice(2))];
        const isValid = (
          // Balcony section (B)
          (section === 'B' && 
            ['A', 'B', 'C'].includes(row) && number >= 1 && number <= 6
          ) ||
          // Back section (F)
          (section === 'F' && 
            ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].includes(row) && 
            ((number >= 1 && number <= 7) || (number >= 8 && number <= 14))
          ) ||
          // Front section (R)
          (section === 'R' && 
            ['L', 'M', 'N', 'P', 'Q', 'R'].includes(row) && 
            ((number >= 1 && number <= 9) || (number >= 10 && number <= 18))
          )
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
      if (!/^[BFR][A-RI][0-9]{1,2}$/.test(seat)) {
        throw new Error(`Invalid seat format: ${seat}. Format should be like BA1, FB2, RC3, etc.`);
      }
      const [section, row, number] = [seat[0], seat[1], parseInt(seat.slice(2))];
      const isValid = (
        // Balcony section (B)
        (section === 'B' && 
          ['A', 'B', 'C'].includes(row) && number >= 1 && number <= 6
        ) ||
        // Back section (F)
        (section === 'F' && 
          ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].includes(row) && 
          ((number >= 1 && number <= 7) || (number >= 8 && number <= 14))
        ) ||
        // Front section (R)
        (section === 'R' && 
          ['L', 'M', 'N', 'P', 'Q', 'R'].includes(row) && 
          ((number >= 1 && number <= 9) || (number >= 10 && number <= 18))
        )
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
  seatNumbers: z.array(z.string().regex(/^[BFR][A-RI][0-9]{1,2}$/, "Invalid seat format"))
    .refine(
      (seats) => seats.every(seat => {
        const [section, row, number] = [seat[0], seat[1], parseInt(seat.slice(2))];
        
        // Check Balcony section (B)
        if (section === 'B') {
          return ['A', 'B', 'C'].includes(row) && number >= 1 && number <= 6;
        }
        
        // Check Back section (F)
        if (section === 'F') {
          return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].includes(row) && 
                ((number >= 1 && number <= 7) || (number >= 8 && number <= 14));
        }
        
        // Check Front section (R)
        if (section === 'R') {
          return ['L', 'M', 'N', 'P', 'Q', 'R'].includes(row) && 
                ((number >= 1 && number <= 9) || (number >= 10 && number <= 18));
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