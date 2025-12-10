// Shared types for admin components

export interface Reservation {
  id: number;
  showId: number;
  userId: number;
  seatNumbers: string;
}

export interface ReservationWithDetails extends Reservation {
  showTitle?: string;
  userName?: string;
  showDate?: Date;
}
