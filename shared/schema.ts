import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
});

export const shows = sqliteTable("shows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  date: text("date").notNull(), // SQLite doesn't have a native timestamp type
  poster: text("poster"),
});

export const reservations = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  showId: integer("show_id").references(() => shows.id),
  seatNumbers: text("seat_numbers").notNull(), // We'll store as JSON string
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Customize the show schema to validate the date
export const insertShowSchema = createInsertSchema(shows).extend({
  date: z.string().refine(
    (str) => new Date(str) > new Date(),
    {
      message: "Shows cannot be scheduled in the past. Please select a future date."
    }
  ).transform(str => new Date(str).toISOString()),
  poster: z.string().optional(),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  showId: true,
  seatNumbers: true,
}).extend({
  seatNumbers: z.array(z.string()).max(4, "Maximum 4 seats per reservation")
    .transform(seats => JSON.stringify(seats)), // Convert array to JSON string for storage
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type User = typeof users.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;