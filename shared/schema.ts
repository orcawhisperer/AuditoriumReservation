import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const shows = pgTable("shows", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  poster: text("poster"),
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  showId: integer("show_id").references(() => shows.id),
  seatNumbers: text("seat_numbers").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  ).transform(str => new Date(str)),
  poster: z.string().optional(),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  showId: true,
  seatNumbers: true,
}).extend({
  seatNumbers: z.array(z.string()).max(4, "Maximum 4 seats per reservation"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type InsertReservation = z.infer<typeof insertReservationSchema>;

export type User = typeof users.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;