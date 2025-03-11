import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const venues = sqliteTable("venues", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  image: text("image"),
  rows: integer("rows").notNull(),
  seatsPerRow: integer("seats_per_row").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

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
  venueId: integer("venue_id").references(() => venues.id),
  description: text("description"),
  themeColor: text("theme_color").default("#4B5320"),
  emoji: text("emoji"),
});

export const reservations = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  showId: integer("show_id").references(() => shows.id),
  seatNumbers: text("seat_numbers").notNull(), 
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Venue schema
export const insertVenueSchema = createInsertSchema(venues).extend({
  name: z.string().min(1, "Venue name is required"),
  rows: z.number().min(1, "Must have at least one row").max(50, "Maximum 50 rows allowed"),
  seatsPerRow: z.number().min(1, "Must have at least one seat per row").max(50, "Maximum 50 seats per row allowed"),
  image: z.string().optional(),
});

// User schema
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

// Show schema
export const insertShowSchema = createInsertSchema(shows).extend({
  date: z.string().refine(
    (str) => new Date(str) > new Date(),
    {
      message: "Shows cannot be scheduled in the past. Please select a future date."
    }
  ).transform(str => new Date(str).toISOString()),
  poster: z.string().optional(),
  venueId: z.number().min(1, "Please select a venue"),
  description: z.string().optional(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  emoji: z.string().optional(),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  showId: true,
  seatNumbers: true,
}).extend({
  seatNumbers: z.array(z.string()).max(4, "Maximum 4 seats per reservation")
    .transform(seats => JSON.stringify(seats)),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type User = typeof users.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;