import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { hashPassword, comparePasswords } from "./utils/password";
import { insertShowSchema, insertReservationSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { eq, and, or, sql } from 'drizzle-orm';
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
  
  // New endpoint for users to change their own password
  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).send("Current password and new password are required");
    }
    
    // Get the current user
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    
    // Verify the current password
    const passwordMatches = await comparePasswords(currentPassword, user.password);
    if (!passwordMatches) {
      return res.status(400).send("Current password is incorrect");
    }
    
    // Hash the new password and update it
    const hashedPassword = await hashPassword(newPassword);
    
    // Log the operation for debugging
    console.log(`Changing password for user ${user.username} (ID: ${user.id})`);
    
    await storage.resetUserPassword(user.id, hashedPassword);
    
    res.status(200).json({ success: true });
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

  app.patch("/api/users/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).send("Authentication required");
    }

    const userId = parseInt(req.params.id);
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Check if user is trying to update their own profile or is an admin
    if (req.user.id !== userId && !req.user.isAdmin) {
      return res.status(403).send("You can only update your own profile");
    }

    // Don't allow regular users to modify admin status
    if (!req.user.isAdmin && (req.body.isAdmin !== undefined || req.body.isEnabled !== undefined)) {
      return res.status(403).send("You cannot modify admin or enabled status");
    }

    // Special rules for admin users
    if (req.user.isAdmin) {
      // Don't allow editing the primary admin
      const users = await storage.getUsers();
      const primaryAdmin = users.find(u => u.isAdmin);
      if (user.id === primaryAdmin?.id && req.user.id !== primaryAdmin.id) {
        return res.status(403).send("Cannot modify primary admin account");
      }
    }

    // If password is included in the update, hash it
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    } else {
      delete updateData.password;
    }

    const updatedUser = await storage.updateUser(userId, updateData);
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
  // Add new endpoint for getting all reservations
  app.get("/api/reservations", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const reservations = await storage.getReservations();
    res.json(reservations);
  });

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
              where: sql`${shows.id} = ${parsed.data.showId}`
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
              where: sql`${reservations.userId} = ${req.user!.id}`
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
              where: sql`${reservations.showId} = ${show.id}`
            });

            const reservedSeats = existingReservations.flatMap((r) => {
              try {
                if (typeof r.seatNumbers === 'string') {
                  return (r.seatNumbers as string).startsWith('[') 
                    ? JSON.parse(r.seatNumbers as string) 
                    : (r.seatNumbers as string).split(',').map((s: string) => s.trim());
                } else if (Array.isArray(r.seatNumbers)) {
                  return r.seatNumbers;
                }
                return [];
              } catch (e) {
                console.error("Error parsing seat numbers:", e);
                return [];
              }
            });

            console.log(`[Transaction ${retryCount}] Current reserved seats:`, reservedSeats);

            const seatNumbers = Array.isArray(parsed.data.seatNumbers) 
              ? parsed.data.seatNumbers 
              : (typeof parsed.data.seatNumbers === 'string'
                ? ((parsed.data.seatNumbers as string).startsWith('[') 
                  ? JSON.parse(parsed.data.seatNumbers as string) 
                  : (parsed.data.seatNumbers as string).split(',').map((s: string) => s.trim()))
                : []);
            console.log(`[Transaction ${retryCount}] Attempting to reserve seats:`, seatNumbers);

            // Check if the number of seats exceeds the user's seat limit
            // Handle the case where seatLimit column might not exist yet
            // Skip seat limit check for admin users
            if (!req.user!.isAdmin) {
              let seatLimit = 4; // Default to 4
              try {
                // Try to use the user's seatLimit if it exists
                seatLimit = req.user!.seatLimit ?? 4;
              } catch (error) {
                console.log(`[Transaction ${retryCount}] seatLimit not found, using default of 4`);
              }
              
              if (seatNumbers.length > seatLimit) {
                console.log(`[Transaction ${retryCount}] Seat limit exceeded: ${seatNumbers.length} > ${seatLimit}`);
                throw new Error(`You can only reserve up to ${seatLimit} seats`);
              }
            } else {
              console.log(`[Transaction ${retryCount}] Skipping seat limit check for admin user`);
            }

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

  // Add the PATCH endpoint for updating reservations
  app.patch("/api/reservations/:id", async (req, res) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }

    const reservationId = parseInt(req.params.id);
    const parsed = insertReservationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    try {
      // Start transaction
      await db.transaction(async (tx) => {
        // Check if reservation exists
        const existingReservation = await tx.query.reservations.findFirst({
          where: sql`${reservations.id} = ${reservationId}`
        });

        if (!existingReservation) {
          throw new Error("Reservation not found");
        }

        // Check if show exists and is not in the past
        const show = await tx.query.shows.findFirst({
          where: sql`${shows.id} = ${parsed.data.showId}`
        });

        if (!show) {
          throw new Error("Show not found");
        }

        if (new Date(show.date) < new Date()) {
          throw new Error("Cannot modify reservations for past shows");
        }

        // Get all reservations for this show except the current one
        const existingReservations = await tx.query.reservations.findMany({
          where: sql`${reservations.showId} = ${show.id}`
        });

        const otherReservations = existingReservations.filter(
          (r) => r.id !== reservationId
        );

        const reservedSeats = otherReservations.flatMap((r) => {
          try {
            if (typeof r.seatNumbers === 'string') {
              return (r.seatNumbers as string).startsWith('[') 
                ? JSON.parse(r.seatNumbers as string) 
                : (r.seatNumbers as string).split(',').map((s: string) => s.trim());
            } else if (Array.isArray(r.seatNumbers)) {
              return r.seatNumbers;
            }
            return [];
          } catch (e) {
            console.error("Error parsing seat numbers:", e);
            return [];
          }
        });

        // Check for seat conflicts
        const seatNumbers = Array.isArray(parsed.data.seatNumbers) 
          ? parsed.data.seatNumbers 
          : (typeof parsed.data.seatNumbers === 'string'
            ? ((parsed.data.seatNumbers as string).startsWith('[') 
              ? JSON.parse(parsed.data.seatNumbers as string) 
              : (parsed.data.seatNumbers as string).split(',').map((s: string) => s.trim()))
            : []);
        
        // Get the user who owns the reservation
        const reservationUser = await tx.query.users.findFirst({
          where: sql`${users.id} = ${existingReservation.userId}`
        });
        
        if (!reservationUser) {
          throw new Error("User not found");
        }
        
        // Check if the number of seats exceeds the user's seat limit
        // Skip seat limit check for admin users (who are making the edit)
        if (!req.user!.isAdmin) {
          // Handle the case where seatLimit column might not exist yet
          let seatLimit = 4; // Default to 4
          try {
            // Try to use the user's seatLimit if it exists
            seatLimit = reservationUser.seatLimit ?? 4;
          } catch (error) {
            console.log(`seatLimit not found for user ${reservationUser.id}, using default of 4`);
          }
          
          if (seatNumbers.length > seatLimit) {
            throw new Error(`User can only reserve up to ${seatLimit} seats`);
          }
        } else {
          console.log(`Skipping seat limit check for admin user editing reservation`);
        }
        
        const hasConflict = seatNumbers.some((seat: string) =>
          reservedSeats.includes(seat)
        );

        if (hasConflict) {
          throw new Error("Some seats are already reserved");
        }

        // Update the reservation
        const [updatedReservation] = await tx
          .update(reservations)
          .set({
            showId: parsed.data.showId,
            seatNumbers: parsed.data.seatNumbers,
          })
          .where(sql`${reservations.id} = ${reservationId}`)
          .returning();

        res.json(updatedReservation);
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).send(error.message);
      } else {
        res.status(500).send("An unexpected error occurred");
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}