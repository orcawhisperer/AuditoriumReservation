import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  isSuper: integer("is_super", { mode: "boolean" }).notNull().default(false),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
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
  seatLayout: text("seat_layout").notNull().default(JSON.stringify([
    {
      section: "Balcony",
      rows: [
        { row: "C", seats: Array.from({length: 12}, (_, i) => i + 1), total_seats: 12 },
        { row: "B", seats: Array.from({length: 12}, (_, i) => i + 1), total_seats: 12 },
        { row: "A", seats: [9, 10, 11, 12], total_seats: 4 }
      ],
      total_section_seats: 28
    },
    {
      section: "Downstairs",
      rows: [
        { row: "N", seats: [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16], total_seats: 12 },
        ...["M", "L", "K", "J", "I", "H", "G"].map(row => ({
          row,
          seats: Array.from({length: 16}, (_, i) => i + 1),
          total_seats: 16
        })),
        ...["F", "E", "D", "C", "B", "A"].map(row => ({
          row,
          seats: Array.from({length: 18}, (_, i) => i + 1),
          total_seats: 18
        }))
      ],
      total_section_seats: 232
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
  isAdmin: z.boolean().optional(),
  isSuper: z.literal(false).optional(), 
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
  blockedSeats: z.string().transform(str => {
    if (!str || str.trim() === '') {
      return JSON.stringify([]);
    }

    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed);
      }
    } catch (e) {
    }

    const seats = str.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    seats.forEach(seat => {
      if (!/^[BD][A-N][0-9]{1,2}$/.test(seat)) {
        throw new Error(`Invalid seat format: ${seat}. Format should be like BA1, DB2, etc.`);
      }
      const [section, row, number] = [seat[0], seat[1], parseInt(seat.slice(2))];
      const isValid = (
        (section === 'B' && 
          ((row === 'C' || row === 'B') && number >= 1 && number <= 12) || 
          (row === 'A' && number >= 9 && number <= 12)
        ) ||
        (section === 'D' && (
          (row === 'N' && [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16].includes(number)) ||
          (row >= 'G' && row <= 'M' && number >= 1 && number <= 16) ||
          (row >= 'A' && row <= 'F' && number >= 1 && number <= 18)
        ))
      );
      if (!isValid) {
        throw new Error(`Invalid seat number: ${seat}. This seat does not exist in the layout.`);
      }
    });
    return JSON.stringify(seats);
  }),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  showId: true,
  seatNumbers: true,
}).extend({
  seatNumbers: z.array(z.string().regex(/^[BD][A-N][0-9]{1,2}$/, "Invalid seat format")).max(4, "Maximum 4 seats per reservation")
    .refine(
      (seats) => seats.every(seat => {
        const [section, row, number] = [seat[0], seat[1], parseInt(seat.slice(2))];
        if (section === 'B') {
          if (row === 'C' || row === 'B') return number >= 1 && number <= 12; 
          if (row === 'A') return number >= 9 && number <= 12; 
          return false;
        }
        if (section === 'D') {
          if (row === 'N') return [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16].includes(number);
          if (row >= 'G' && row <= 'M') return number >= 1 && number <= 16;
          if (row >= 'A' && row <= 'F') return number >= 1 && number <= 18;
        }
        return false;
      }),
      { message: "Invalid seat selection" }
    )
    .transform(seats => JSON.stringify(seats)),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type User = typeof users.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;