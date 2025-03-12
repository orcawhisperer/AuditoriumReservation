import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { insertShowSchema, insertReservationSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, shows, reservations } from '@shared/schema';
import { insertUserSchema } from "@shared/schema"; // Import missing schema


export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // User management routes
  app.get("/api/users", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => { // New user creation route
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const existingUser = await storage.getUserByUsername(parsed.data.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const hashedPassword = await hashPassword(parsed.data.password);
    const user = await storage.createUser({
      ...parsed.data,
      password: hashedPassword,
    });

    res.status(201).json(user);
  });

  app.post("/api/users/:id/reset-password", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    if (user.isAdmin) {
      return res.status(403).send("Cannot reset admin password");
    }

    // Generate a temporary password
    const temporaryPassword = randomBytes(4).toString("hex");
    const hashedPassword = await hashPassword(temporaryPassword);
    await storage.resetUserPassword(userId, hashedPassword);

    res.json({ temporaryPassword });
  });

  app.post("/api/users/:id/toggle-admin", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const users = await storage.getUsers();
    const primaryAdmin = users.find(u => u.isAdmin);

    // Only the primary admin (first admin) can modify admin status
    if (req.user.id !== primaryAdmin?.id) {
      return res.status(403).send("Only the primary admin can modify admin status");
    }

    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Prevent primary admin from removing their own admin status
    if (user.id === primaryAdmin?.id) {
      return res.status(403).send("Cannot modify primary admin status");
    }

    const { isAdmin } = req.body;
    if (typeof isAdmin !== "boolean") {
      return res.status(400).send("Invalid admin status");
    }

    await storage.toggleUserAdmin(userId, isAdmin);
    // Return the updated user data
    const updatedUser = await storage.getUser(userId);
    res.json(updatedUser);
  });

  app.post("/api/users/:id/toggle-status", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    if (user.isAdmin) {
      return res.status(403).send("Cannot modify admin status");
    }

    const { isEnabled } = req.body;
    if (typeof isEnabled !== "boolean") {
      return res.status(400).send("Invalid status");
    }

    await storage.toggleUserStatus(userId, isEnabled);
    // Return the updated user data instead of just OK
    const updatedUser = await storage.getUser(userId);
    res.json(updatedUser);
  });

  // Show routes
  app.get("/api/shows", async (_req, res) => {
    const shows = await storage.getShows();
    res.json(shows);
  });

  app.get("/api/shows/:id", async (req, res) => {
    const show = await storage.getShow(parseInt(req.params.id));
    if (!show) {
      return res.status(404).send("Show not found");
    }
    res.json(show);
  });

  app.post("/api/shows", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const parsed = insertShowSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const show = await storage.createShow(parsed.data);
    res.status(201).json(show);
  });

  app.delete("/api/shows/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    await storage.deleteShow(parseInt(req.params.id));
    res.sendStatus(200);
  });

  app.patch("/api/shows/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const parsed = insertShowSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const show = await storage.getShow(parseInt(req.params.id));
    if (!show) {
      return res.status(404).send("Show not found");
    }

    const updatedShow = await storage.updateShow(parseInt(req.params.id), parsed.data);
    res.json(updatedShow);
  });

  // Reservation routes with improved transaction handling and logging
  app.post("/api/reservations", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const parsed = insertReservationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    try {
      // Start a transaction with retries for handling concurrent requests
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          // Start transaction
          await db.transaction(async (tx) => {
            console.log(`[Transaction ${retryCount}] Starting reservation for user ${req.user!.id} for show ${parsed.data.showId}`);

            const show = await tx.query.shows.findFirst({
              where: eq(shows.id, parsed.data.showId)
            });

            if (!show) {
              console.log(`[Transaction ${retryCount}] Show not found: ${parsed.data.showId}`);
              throw new Error("Show not found");
            }

            console.log(`[Transaction ${retryCount}] Found show: ${show.title} on ${show.date}`);

            // Check if show date is in the past
            if (new Date(show.date) < new Date()) {
              console.log(`[Transaction ${retryCount}] Show date is in the past: ${show.date}`);
              throw new Error("Cannot make reservations for past shows");
            }

            // Check if user already has a reservation for this show
            const userReservations = await tx.query.reservations.findMany({
              where: eq(reservations.userId, req.user!.id)
            });

            const existingReservation = userReservations.find(
              (r) => r.showId === show.id
            );

            if (existingReservation) {
              console.log(`[Transaction ${retryCount}] User already has reservation: ${existingReservation.id}`);
              throw new Error("You already have a reservation for this show");
            }

            // Get all reservations for this show within the transaction
            const existingReservations = await tx.query.reservations.findMany({
              where: eq(reservations.showId, show.id)
            });

            const reservedSeats = existingReservations.flatMap((r) =>
              JSON.parse(r.seatNumbers)
            );

            console.log(`[Transaction ${retryCount}] Current reserved seats:`, reservedSeats);

            const seatNumbers = JSON.parse(parsed.data.seatNumbers) as string[];
            console.log(`[Transaction ${retryCount}] Attempting to reserve seats:`, seatNumbers);

            const hasConflict = seatNumbers.some((seat: string) =>
              reservedSeats.includes(seat)
            );

            if (hasConflict) {
              console.log(`[Transaction ${retryCount}] Seat conflict detected`);
              throw new Error("Some seats are already reserved");
            }

            // If we get here, we can safely create the reservation
            console.log(`[Transaction ${retryCount}] Creating reservation`);
            const reservation = await tx.insert(reservations).values({
              userId: req.user!.id,
              ...parsed.data,
            }).returning();

            console.log(`[Transaction ${retryCount}] Reservation created successfully:`, reservation[0]);
            res.status(201).json(reservation[0]);
          });

          // If we get here, transaction succeeded
          console.log(`[Transaction ${retryCount}] Transaction completed successfully`);
          return;

        } catch (error) {
          console.error(`[Transaction ${retryCount}] Failed:`, error);

          if (error instanceof Error && (
            error.message.includes("SQLITE_BUSY") ||
            error.message.includes("database is locked")
          )) {
            // Only retry on concurrent access errors
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`[Transaction ${retryCount}] Retrying after delay...`);
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount)));
              continue;
            }
          }

          // Rethrow other errors or if we're out of retries
          throw error;
        }
      }

      // If we get here, we ran out of retries
      throw new Error("Failed to complete reservation after multiple attempts");

    } catch (error) {
      console.error('[Reservation Error]', error);
      if (error instanceof Error) {
        res.status(400).send(error.message);
      } else {
        res.status(500).send("An unexpected error occurred");
      }
    }
  });

  app.get("/api/reservations/show/:showId", async (req, res) => {
    const reservations = await storage.getReservationsByShow(
      parseInt(req.params.showId),
    );
    res.json(reservations);
  });

  app.get("/api/reservations/user", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const reservations = await storage.getReservationsByUser(req.user.id);
    res.json(reservations);
  });

  app.delete("/api/reservations/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const reservations = await storage.getReservationsByUser(req.user.id);
    const reservation = reservations.find(
      (r) => r.id === parseInt(req.params.id),
    );

    if (!reservation) {
      return res.status(404).send("Reservation not found");
    }

    await storage.deleteReservation(reservation.id);
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}