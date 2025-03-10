import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertShowSchema, insertReservationSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { hash } from "bcrypt";

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const hashedPassword = await hash(password, saltRounds);
  return hashedPassword;
}

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

  // Reservation routes
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

  app.post("/api/reservations", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const parsed = insertReservationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const show = await storage.getShow(parsed.data.showId);
    if (!show) {
      return res.status(404).send("Show not found");
    }

    // Check if show date is in the past
    if (new Date(show.date) < new Date()) {
      return res.status(400).send("Cannot make reservations for past shows");
    }

    // Check if user already has a reservation for this show
    const userReservations = await storage.getReservationsByUser(req.user.id);
    const existingReservation = userReservations.find(
      (r) => r.showId === show.id,
    );
    if (existingReservation) {
      return res
        .status(400)
        .send("You already have a reservation for this show");
    }

    // Check for seat conflicts
    const existingReservations = await storage.getReservationsByShow(show.id);
    const reservedSeats = existingReservations.flatMap((r) =>
      JSON.parse(r.seatNumbers),
    );
    const seatNumbers = JSON.parse(parsed.data.seatNumbers) as string[];
    const hasConflict = seatNumbers.some((seat: string) =>
      reservedSeats.includes(seat),
    );

    if (hasConflict) {
      return res.status(400).send("Some seats are already reserved");
    }

    const reservation = await storage.createReservation(
      req.user.id,
      parsed.data,
    );
    res.status(201).json(reservation);
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