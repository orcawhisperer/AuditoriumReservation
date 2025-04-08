// This script updates seat layout prefixes in the database
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sqlite3 from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to the database
const db = sqlite3('sqlite.db');

console.log('Starting seat layout update...');

try {
  // Get all shows
  const shows = db.prepare('SELECT id, seat_layout FROM shows').all();
  console.log(`Found ${shows.length} shows to update.`);

  // Update each show
  shows.forEach(show => {
    // Parse the seat layout
    let layout;
    try {
      layout = JSON.parse(show.seat_layout);
    } catch (e) {
      console.error(`Error parsing layout for show ${show.id}:`, e);
      return;
    }

    // Update the blocked seats array if it exists
    const blockedSeatsQuery = db.prepare('SELECT blocked_seats FROM shows WHERE id = ?').get(show.id);
    let blockedSeats = [];
    
    if (blockedSeatsQuery && blockedSeatsQuery.blocked_seats) {
      try {
        if (blockedSeatsQuery.blocked_seats.startsWith('[')) {
          blockedSeats = JSON.parse(blockedSeatsQuery.blocked_seats);
        } else {
          blockedSeats = blockedSeatsQuery.blocked_seats.split(',').map(s => s.trim());
        }
        
        // Update blocked seats from old to new prefix format
        const updatedBlockedSeats = blockedSeats.map(seat => {
          // Only process string seats
          if (typeof seat !== 'string') return seat;
          
          const prefix = seat[0];
          const rest = seat.substring(1);
          
          // B for Balcony stays the same
          if (prefix === 'B') return seat;
          
          // Update F to R for Back Section (old format used F for back)
          if (prefix === 'F') {
            // Check if it's a back section seat (rows G-N)
            if (['G','H','I','J','K','L','M','N'].includes(rest[0])) {
              return 'R' + rest;
            }
          }
          
          // Update R to F for Front Section (old format used R for front)
          if (prefix === 'R') {
            // Check if it's a front section seat (rows A-F)
            if (['A','B','C','D','E','F'].includes(rest[0])) {
              return 'F' + rest;
            }
          }
          
          // Return unchanged if no pattern matched
          return seat;
        });
        
        // Update the blocked seats in the database
        const blockedSeatsJson = JSON.stringify(updatedBlockedSeats);
        db.prepare('UPDATE shows SET blocked_seats = ? WHERE id = ?').run(blockedSeatsJson, show.id);
        console.log(`Updated blocked seats for show ${show.id}`);
      } catch (e) {
        console.error(`Error updating blocked seats for show ${show.id}:`, e);
      }
    }

    // Also check for any existing reservations
    const reservationsQuery = db.prepare('SELECT id, seat_numbers FROM reservations WHERE show_id = ?').all(show.id);
    if (reservationsQuery && reservationsQuery.length > 0) {
      console.log(`Found ${reservationsQuery.length} reservations to update for show ${show.id}`);
      
      // Update each reservation
      reservationsQuery.forEach(reservation => {
        try {
          let seatNumbers = [];
          if (typeof reservation.seat_numbers === 'string') {
            if (reservation.seat_numbers.startsWith('[')) {
              seatNumbers = JSON.parse(reservation.seat_numbers);
            } else {
              seatNumbers = reservation.seat_numbers.split(',').map(s => s.trim());
            }
          }

          // Update seats from old to new prefix format
          const updatedSeatNumbers = seatNumbers.map(seat => {
            // Only process string seats
            if (typeof seat !== 'string') return seat;
            
            const prefix = seat[0];
            const rest = seat.substring(1);
            
            // B for Balcony stays the same
            if (prefix === 'B') return seat;
            
            // Update F to R for Back Section (old format used F for back)
            if (prefix === 'F') {
              // Check if it's a back section seat (rows G-N)
              if (['G','H','I','J','K','L','M','N'].includes(rest[0])) {
                return 'R' + rest;
              }
            }
            
            // Update R to F for Front Section (old format used R for front)
            if (prefix === 'R') {
              // Check if it's a front section seat (rows A-F)
              if (['A','B','C','D','E','F'].includes(rest[0])) {
                return 'F' + rest;
              }
            }
            
            // Return unchanged if no pattern matched
            return seat;
          });
          
          // Update the reservation in the database
          const seatNumbersJson = JSON.stringify(updatedSeatNumbers);
          db.prepare('UPDATE reservations SET seat_numbers = ? WHERE id = ?').run(seatNumbersJson, reservation.id);
          console.log(`Updated reservation ${reservation.id}`);
        } catch (e) {
          console.error(`Error updating reservation ${reservation.id}:`, e);
        }
      });
    }

    console.log(`Successfully updated show ${show.id}`);
  });

  console.log('Seat layout update completed successfully!');
} catch (error) {
  console.error('Error updating seat layout:', error);
} finally {
  db.close();
}