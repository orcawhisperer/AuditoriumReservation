import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  blob,
} from "drizzle-orm/sqlite-core";
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
  category: text("category", { enum: ["single", "family", "fafa"] }).notNull().default("single"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
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
  allowedCategories: text("allowed_categories").notNull().default('["single","family","fafa"]'), // JSON array of allowed categories
  fafaExclusiveRows: text("fafa_exclusive_rows").notNull().default("[]"), // JSON array of rows exclusive to FAFA users
  foodMenu: text("food_menu"), // Base64 encoded food menu image
  seatLayout: text("seat_layout")
    .notNull()
    .default(
      JSON.stringify([
        {
          section: "Balcony",
          rows: [
            { row: "P", seats: [1, 2, 3, 4, 5, 6, 7, 9], total_seats: 9 },
            { row: "O", seats: [1, 2, 3, 4, 5, 6, 7, 9], total_seats: 9 },
          ],
          total_section_seats: 18,
        },
        {
          section: "Back",
          rows: [
            {
              row: "N",
              seats: [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16],
              total_seats: 12,
            }, // Row N missing 5-8 (server room)
            ...["M", "L", "K", "J", "I", "H", "G"].map((row) => ({
              row,
              seats: Array.from({ length: 16 }, (_, i) => i + 1),
              total_seats: 16,
            })),
          ],
          total_section_seats: 124,
        },
        {
          section: "Front",
          rows: [
            ...["F", "E", "D", "C", "B", "A"].map((row) => ({
              row,
              seats: Array.from({ length: 18 }, (_, i) => i + 1),
              total_seats: 18,
            })),
          ],
          total_section_seats: 108,
        },
        {
          section: "Plastic",
          rows: [
            ...["R1", "R2", "R3"].map((row) => ({
              row,
              seats: Array.from({ length: 18 }, (_, i) => i + 1),
              total_seats: 18,
            })),
          ],
          total_section_seats: 54,
        },
      ]),
    ),
});

export const reservations = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  showId: integer("show_id").references(() => shows.id),
  seatNumbers: text("seat_numbers").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
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
    { message: "Must be at least 13 years old" },
  ),
  category: z.enum(["single", "family", "fafa"], {
    required_error: "Please select a category",
  }).default("single"),
  seatLimit: z
    .number()
    .int()
    .min(1, "Minimum seat limit is 1")
    .max(10, "Maximum seat limit is 10")
    .default(4),
});

export const insertShowSchema = createInsertSchema(shows).extend({
  date: z
    .string()
    .refine((str) => new Date(str) > new Date(), {
      message:
        "Shows cannot be scheduled in the past. Please select a future date.",
    })
    .transform((str) => new Date(str).toISOString()),
  poster: z.string().optional(),
  description: z.string().optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional(),
  emoji: z.string().optional(),
  price: z.number().int().min(0, "Price cannot be negative").default(0),
  allowedCategories: z.array(z.enum(["single", "family", "fafa"])).default(["single", "family", "fafa"]),
  fafaExclusiveRows: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.split(',').map(s => s.trim()).filter(s => s);
      }
      return val;
    })
    .default([]), // Array of row identifiers like ["A", "B"] or ["R1", "R2"]
  foodMenu: z.string().optional(), // Base64 encoded food menu image
  blockedSeats: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => {
      if (typeof val === 'string') {
        return val.split(',').map(s => s.trim()).filter(s => s);
      }
      return val;
    })
    .default([]).refine(
    (seats) => {
      // Validate each seat format
      return seats.every((seat) => {
        // Check for plastic seats format (R1, R2, R3 followed by seat number)
        if (/^R[123][0-9]{1,2}$/.test(seat)) {
          const row = seat.substring(0, 2); // R1, R2, or R3
          const number = parseInt(seat.slice(2));
          
          // Plastic seats have 18 seats per row (1-18)
          return (row === "R1" || row === "R2" || row === "R3") && number >= 1 && number <= 18;
        }
        
        // Check for regular seats format (A-P followed by seat number)
        if (!/^[A-P][0-9]{1,2}$/.test(seat)) {
          return false;
        }

        const row = seat[0];
        const number = parseInt(seat.slice(1));

        // Balcony (rows O-P)
        if ((row === "O" || row === "P") && number >= 1 && number <= 9) {
          return true;
        }

        // Row N with server room (missing 5-8)
        if (
          row === "N" &&
          [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16].includes(number)
        ) {
          return true;
        }

        // Back section (rows G-M)
        if (row >= "G" && row <= "M" && number >= 1 && number <= 16) {
          return true;
        }

        // Front section (rows A-F)
        if (row >= "A" && row <= "F" && number >= 1 && number <= 18) {
          return true;
        }

        return false;
      });
    },
    { message: "Invalid seat selection" }
  ),
});

export const insertReservationSchema = createInsertSchema(reservations)
  .pick({
    showId: true,
    seatNumbers: true,
  })
  .extend({
    seatNumbers: z
      .array(z.string().regex(/^([A-P][0-9]{1,2}|R[123][0-9]{1,3})$/, "Invalid seat format"))
      .refine(
        (seats) =>
          seats.every((seat) => {
            // Check for plastic seats format (R1, R2, R3 followed by seat number)
            if (/^R[123][0-9]{1,3}$/.test(seat)) {
              const row = seat.substring(0, 2); // R1, R2, or R3
              const number = parseInt(seat.slice(2));
              
              // Plastic seats have 18 seats per row (1-18)
              return (row === "R1" || row === "R2" || row === "R3") && number >= 1 && number <= 18;
            }
            
            // Check for regular seats
            const row = seat[0];
            const number = parseInt(seat.slice(1));

            // Balcony (rows O-P) - updated to allow seats 1-7, 9-11 (missing seat 8)
            if ((row === "O" || row === "P") && (number >= 1 && number <= 7 || number >= 9 && number <= 11)) {
              return true;
            }

            // Row N with server room (missing 5-8)
            if (
              row === "N" &&
              [1, 2, 3, 4, 9, 10, 11, 12, 13, 14, 15, 16].includes(number)
            ) {
              return true;
            }

            // Back section (rows G-M)
            if (row >= "G" && row <= "M" && number >= 1 && number <= 16) {
              return true;
            }

            // Front section (rows A-F)
            if (row >= "A" && row <= "F" && number >= 1 && number <= 18) {
              return true;
            }

            return false;
          }),
        { message: "Invalid seat selection" },
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
