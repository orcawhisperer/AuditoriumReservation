import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertShowSchema, insertReservationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Show routes
  app.get("/api/shows", async (_req, res) => {
    const shows = await storage.getShows();
    res.json(shows);
  });

  // Add endpoint for fetching a single show
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
    console.log(parsed.data.seatNumbers, reservedSeats);
    const hasConflict = JSON.parse(parsed.data.seatNumbers).some((seat) =>
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
