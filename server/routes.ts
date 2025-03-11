import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { insertShowSchema, insertReservationSchema, insertVenueSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, shows, reservations, venues } from '@shared/schema';
import { insertUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Venue management routes
  app.get("/api/venues", async (_req, res) => {
    const venues = await storage.getVenues();
    res.json(venues);
  });

  app.post("/api/venues", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const parsed = insertVenueSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const venue = await storage.createVenue(parsed.data);
    res.status(201).json(venue);
  });

  app.put("/api/venues/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const parsed = insertVenueSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const venue = await storage.getVenue(parseInt(req.params.id));
    if (!venue) {
      return res.status(404).send("Venue not found");
    }

    const updatedVenue = await storage.updateVenue(venue.id, parsed.data);
    res.json(updatedVenue);
  });

  app.delete("/api/venues/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const venue = await storage.getVenue(parseInt(req.params.id));
    if (!venue) {
      return res.status(404).send("Venue not found");
    }

    // Check if venue has any shows
    const shows = await storage.getShows();
    const hasShows = shows.some(show => show.venueId === venue.id);
    if (hasShows) {
      return res.status(400).send("Cannot delete venue with existing shows");
    }

    await storage.deleteVenue(venue.id);
    res.sendStatus(200);
  });

  // User management routes
  app.get("/api/users", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
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

  app.put("/api/users/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const parsed = insertUserSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    if (parsed.data.password) {
      parsed.data.password = await hashPassword(parsed.data.password);
    }

    const updatedUser = await storage.updateUser(userId, parsed.data);
    res.json(updatedUser);
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    if (user.isAdmin) {
      return res.status(403).send("Cannot delete admin user");
    }

    await storage.deleteUser(userId);
    res.sendStatus(200);
  });

  // Show routes with venue validation
  app.post("/api/shows", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const parsed = insertShowSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    // Verify venue exists
    const venue = await storage.getVenue(parsed.data.venueId);
    if (!venue) {
      return res.status(400).send("Invalid venue selected");
    }

    const show = await storage.createShow(parsed.data);
    res.status(201).json(show);
  });

  app.put("/api/shows/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const showId = parseInt(req.params.id);
    const show = await storage.getShow(showId);

    if (!show) {
      return res.status(404).send("Show not found");
    }

    const parsed = insertShowSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    if (parsed.data.venueId) {
      const venue = await storage.getVenue(parsed.data.venueId);
      if (!venue) {
        return res.status(400).send("Invalid venue selected");
      }
    }

    const updatedShow = await storage.updateShow(showId, parsed.data);
    res.json(updatedShow);
  });

  app.delete("/api/shows/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    await storage.deleteShow(parseInt(req.params.id));
    res.sendStatus(200);
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