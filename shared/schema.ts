import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
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
  // Remove totalSeats as we now have a fixed layout
  seatLayout: text("seat_layout").notNull().default(JSON.stringify({
    balcony: {
      rows: ["A", "B", "C"],
      seatsPerRow: 12
    },
    middle: {
      rows: ["N", "M", "L", "K", "J", "I", "H", "G"],
      seatsPerRow: 16
    },
    lower: {
      rows: ["F", "E", "D", "C", "B", "A"],
      seatsPerRow: 17
    }
  })),
});

export const reservations = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  showId: integer("show_id").references(() => shows.id),
  seatNumbers: text("seat_numbers").notNull(), 
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Extended user schema for registration
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
});

// Customize the show schema with new fields
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
  seatLayout: z.string().optional(),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  showId: true,
  seatNumbers: true,
}).extend({
  seatNumbers: z.array(z.string().regex(/^[A-N][0-9]{1,2}$/, "Invalid seat format")).max(4, "Maximum 4 seats per reservation")
    .refine(
      (seats) => seats.every(seat => {
        const [row, number] = [seat[0], parseInt(seat.slice(1))];
        if (row >= 'A' && row <= 'C') return number >= 1 && number <= 12; // Balcony
        if (row >= 'G' && row <= 'N') return number >= 1 && number <= 16; // Middle
        if (row >= 'A' && row <= 'F') return number >= 1 && number <= 17; // Lower
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