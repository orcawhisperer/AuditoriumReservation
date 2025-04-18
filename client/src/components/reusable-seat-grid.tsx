import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { Reservation, Show, insertReservationSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

type SeatProps = {
  seatId: string;
  isReserved: boolean;
  isBlocked: boolean;
  isSelected: boolean;
  isUserReservation: boolean; // Add this to indicate seats reserved by the current user
  onSelect: (seatId: string) => void;
};

export function Seat({
  seatId,
  isReserved,
  isBlocked,
  isSelected,
  isUserReservation,
  onSelect,
}: SeatProps) {
  // Extract just the seat number from the end of the seatId (remove section prefix and row)
  const seatNumber = seatId.match(/\d+$/)?.[0] || seatId;
  
  return (
    <button
      className={cn(
        "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded border-2 text-xs font-medium transition-colors shadow-sm",
        isUserReservation &&
          "bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed",
        isReserved &&
          !isUserReservation &&
          "bg-red-100 border-red-200 text-red-500 cursor-not-allowed",
        isBlocked &&
          "bg-yellow-100 border-yellow-200 text-yellow-500 cursor-not-allowed",
        isSelected && "bg-primary border-primary text-primary-foreground",
        !isReserved &&
          !isBlocked &&
          !isSelected &&
          "hover:bg-accent hover:border-accent hover:text-accent-foreground active:scale-95",
      )}
      disabled={isReserved || isBlocked}
      onClick={() => onSelect(seatId)}
      title={isUserReservation ? "Your reservation" : ""}
    >
      {seatNumber}
    </button>
  );
}

// Exit component for auditorium layout
export function Exit({ position }: { position: "left" | "right" | "top" | "bottom" }) {
  const getPositionClasses = () => {
    switch (position) {
      case "left":
        return "flex-row justify-start";
      case "right":
        return "flex-row justify-end";
      case "top":
        return "flex-col justify-start";
      case "bottom":
        return "flex-col justify-end";
    }
  };

  return (
    <div className={`flex items-center ${getPositionClasses()} mx-2 my-3`}>
      <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
        EXIT
      </div>
    </div>
  );
}

interface ReusableSeatGridProps {
  show: Show;
  showReservations: Reservation[];
  userReservations: Reservation[];
  selectedSeats: string[];
  onSeatSelect: (seatId: string) => void;
  isPastCutoffTime?: boolean;
  hideHeader?: boolean;
  hideActionButtons?: boolean;
  isAdminMode?: boolean;
  currentUserId?: number;
}

// This is a reusable version of the seat grid that can be used in both the main UI and admin panel
export function ReusableSeatGrid({
  show,
  showReservations,
  userReservations,
  selectedSeats,
  onSeatSelect,
  isPastCutoffTime = false,
  hideHeader = false,
  hideActionButtons = true,
  isAdminMode = false,
  currentUserId,
}: ReusableSeatGridProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  
  // For regular SeatGrid, this will be the showId from the URL
  const showId = show?.id?.toString() || "";

  // Additional blocked seats function - for balcony row O special case
  const isSpecialBlockedSeat = (
    section: string,
    row: string,
    seatNumber: number,
  ) => {
    // Block seats 4, 8, 12 in balcony row O
    if (
      section === "Balcony" &&
      row === "O" &&
      [4, 8, 12].includes(seatNumber)
    ) {
      return true;
    }

    // Block server room seats (5-8) in row N
    if (
      section === "Back" &&
      row === "N" &&
      seatNumber >= 5 &&
      seatNumber <= 8
    ) {
      return true;
    }

    return false;
  };

  const reserveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        showId: parseInt(showId),
        seatNumbers: selectedSeats,
      };

      const parsed = insertReservationSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error(parsed.error.message);
      }

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/reservations/show/${showId}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/user"] });
      toast({
        title: "Success",
        description: "Seats reserved successfully",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reserve seats",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!show) {
    return <div>Show not found</div>;
  }

  const layout =
    typeof show.seatLayout === "string"
      ? JSON.parse(show.seatLayout)
      : show.seatLayout;

  const reservedSeats = new Set(
    showReservations.flatMap((r) => {
      try {
        return typeof r.seatNumbers === "string"
          ? r.seatNumbers.startsWith("[")
            ? JSON.parse(r.seatNumbers)
            : r.seatNumbers.split(",").map((s) => s.trim())
          : Array.isArray(r.seatNumbers)
            ? r.seatNumbers
            : [];
      } catch (e) {
        console.error("Error parsing seat numbers:", e);
        return [];
      }
    }),
  );

  const blockedSeats = new Set(
    Array.isArray(show.blockedSeats)
      ? show.blockedSeats
      : typeof show.blockedSeats === "string"
        ? show.blockedSeats.startsWith("[")
          ? JSON.parse(show.blockedSeats)
          : show.blockedSeats.split(",").map((s) => s.trim())
        : [],
  );

  const seatLimit = user?.seatLimit || 4;
  
  // Check if user has an existing reservation for this show
  const hasExistingReservation = userReservations.some(
    (reservation) => reservation.showId === parseInt(showId)
  );

  return (
    <div className="space-y-8">
      {!hideHeader && (
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{show.title}</h2>
            <span className="text-sm text-muted-foreground bg-primary/10 px-2 py-1 rounded">
              Shahbaaz Auditorium
            </span>
          </div>
          <p className="text-muted-foreground">
            {format(new Date(show.date), "PPP")} at{" "}
            {format(new Date(show.date), "p")}
          </p>
          <p className="mt-2 text-sm border rounded-md p-2 bg-accent/20 inline-block">
            {user?.isAdmin ? (
              <>
                As an admin, you can book <strong>unlimited</strong> seats.
              </>
            ) : (
              <>
                You can book up to <strong>{seatLimit}</strong> seats for this
                show.
              </>
            )}
          </p>

          {/* Cutoff time alert */}
          {isPastCutoffTime && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Reservation Cutoff Time</AlertTitle>
              <AlertDescription>
                Online reservations are closed 30 minutes before the show starts.
                Please contact the admin at the venue for last-minute
                reservations.
              </AlertDescription>
            </Alert>
          )}

          {show.poster && (
            <div className="mt-4 relative w-full max-w-md mx-auto overflow-hidden rounded-lg border">
              <div className="relative aspect-video">
                <img
                  src={show.poster}
                  alt={`Poster for ${show.title}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {/* Render all sections based on the new layout */}
        {layout.map((section: any) => (
          <div key={section.section} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {section.section}
              <span className="text-sm text-muted-foreground font-normal">
                {section.section === "Balcony"
                  ? "(Prefix: B)"
                  : section.section === "Back"
                    ? "(Prefix: R)"
                    : "(Prefix: F)"}
              </span>
            </h3>
            <div className="w-full bg-muted/30 p-2 sm:p-4 md:p-8 rounded-lg shadow-inner overflow-x-auto">
              <div
                className={`space-y-2 md:space-y-3 ${isMobile ? "min-w-[800px]" : "min-w-max"}`}
              >
                {/* Balcony section header */}
                {section.section === "Balcony" && (
                  <div className="flex justify-center mb-4">
                    <div className="text-sm text-muted-foreground">
                      UPSTAIRS BALCONY
                    </div>
                  </div>
                )}

                {/* Render each row */}
                {section.rows.map((rowData: any, rowIndex: number) => (
                  <div
                    key={rowData.row}
                    className="flex gap-1 sm:gap-2 md:gap-3 justify-center"
                  >
                    {/* Exits on left based on section and row */}
                    {section.section === "Back" && rowData.row === "G" ? (
                      <Exit position="left" />
                    ) : section.section === "Balcony" && rowData.row === "O" ? (
                      <div className="w-[62px]">
                        <Exit position="left" />
                      </div>
                    ) : (
                      /* For all other rows, add a placeholder for alignment */
                      <div className="w-[62px]"></div>
                    )}

                    <span className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                      {rowData.row}
                    </span>

                    <div className="flex flex-wrap gap-0.5 sm:gap-1 relative">
                      {/* Front section with aisle in middle (9 seats on each side) */}
                      {section.section === "Front" && (
                        <>
                          {/* First half (1-9) */}
                          <div className="flex gap-1 mr-4">
                            {Array.from({ length: 9 }).map((_, idx) => {
                              const seatNumber = idx + 1;
                              const prefix = "F"; // Front section prefix
                              const seatId = `${prefix}${rowData.row}${seatNumber}`;
                              
                              // Check if this seat is reserved by the user
                              const isUserReservation = userReservations.some(
                                (reservation) => {
                                  if (reservation.showId !== parseInt(showId))
                                    return false;

                                  // In admin mode, check if this seat belongs to the reservation we're editing
                                  if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                    return false;
                                  }

                                  try {
                                    const seats =
                                      typeof reservation.seatNumbers === "string"
                                        ? reservation.seatNumbers.startsWith("[")
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers
                                              .split(",")
                                              .map((s) => s.trim())
                                        : reservation.seatNumbers || [];

                                    return Array.isArray(seats) && seats.includes(seatId);
                                  } catch (e) {
                                    console.error("Error parsing user reservation seats:", e);
                                    return false;
                                  }
                                },
                              );

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                  isBlocked={blockedSeats.has(seatId)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={onSeatSelect}
                                />
                              );
                            })}
                          </div>

                          {/* Center aisle */}
                          <div className="w-2 sm:w-3 md:w-4"></div>

                          {/* Second half (10-18) */}
                          <div className="flex gap-1">
                            {Array.from({ length: 9 }).map((_, idx) => {
                              const seatNumber = idx + 10;
                              const prefix = "F"; // Front section prefix
                              const seatId = `${prefix}${rowData.row}${seatNumber}`;
                              
                              const isUserReservation = userReservations.some(
                                (reservation) => {
                                  if (reservation.showId !== parseInt(showId))
                                    return false;

                                  // In admin mode, check if this seat belongs to the reservation we're editing
                                  if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                    return false;
                                  }

                                  try {
                                    const seats =
                                      typeof reservation.seatNumbers === "string"
                                        ? reservation.seatNumbers.startsWith("[")
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers
                                              .split(",")
                                              .map((s) => s.trim())
                                        : reservation.seatNumbers || [];

                                    return Array.isArray(seats) && seats.includes(seatId);
                                  } catch (e) {
                                    console.error("Error parsing user reservation seats:", e);
                                    return false;
                                  }
                                },
                              );

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                  isBlocked={blockedSeats.has(seatId)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={onSeatSelect}
                                />
                              );
                            })}
                          </div>
                        </>
                      )}
                      
                      {/* Back section with server room gap in row N */}
                      {section.section === "Back" && (
                        <>
                          {rowData.row === "N" ? (
                            <>
                              {/* First group (1-4) */}
                              <div className="flex gap-1 mr-2">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 1;
                                  const prefix = "R"; // Back section prefix
                                  const seatId = `${prefix}${rowData.row}${seatNumber}`;
                                  
                                  const isUserReservation = userReservations.some(
                                    (reservation) => {
                                      if (reservation.showId !== parseInt(showId))
                                        return false;
                                        
                                      // In admin mode, check if this seat belongs to the reservation we're editing
                                      if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                        return false;
                                      }

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(reservation.seatNumbers)
                                              : reservation.seatNumbers
                                                  .split(",")
                                                  .map((s) => s.trim())
                                            : reservation.seatNumbers || [];

                                        return (
                                          Array.isArray(seats) &&
                                          seats.includes(seatId)
                                        );
                                      } catch (e) {
                                        console.error(
                                          "Error parsing user reservation seats:",
                                          e,
                                        );
                                        return false;
                                      }
                                    },
                                  );

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                      isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={onSeatSelect}
                                    />
                                  );
                                })}
                              </div>
                              
                              {/* Server room gap (seats 5-8 are blocked) */}
                              <div className="flex gap-1 mr-2 items-center">
                                <div className="text-xs text-muted-foreground border border-dashed border-muted-foreground/50 rounded px-2 py-1">
                                  Server Room
                                </div>
                              </div>
                              
                              {/* Second group (9-16) */}
                              <div className="flex gap-1">
                                {Array.from({ length: 8 }).map((_, idx) => {
                                  const seatNumber = idx + 9;
                                  const prefix = "R"; // Back section prefix
                                  const seatId = `${prefix}${rowData.row}${seatNumber}`;
                                  
                                  const isUserReservation = userReservations.some(
                                    (reservation) => {
                                      if (reservation.showId !== parseInt(showId))
                                        return false;
                                        
                                      // In admin mode, check if this seat belongs to the reservation we're editing
                                      if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                        return false;
                                      }

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(reservation.seatNumbers)
                                              : reservation.seatNumbers
                                                  .split(",")
                                                  .map((s) => s.trim())
                                            : reservation.seatNumbers || [];

                                        return (
                                          Array.isArray(seats) &&
                                          seats.includes(seatId)
                                        );
                                      } catch (e) {
                                        console.error(
                                          "Error parsing user reservation seats:",
                                          e,
                                        );
                                        return false;
                                      }
                                    },
                                  );

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                      isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={onSeatSelect}
                                    />
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <>
                              {/* First group (1-4) */}
                              <div className="flex gap-1 mr-2">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 1;
                                  const prefix = "R"; // Back section prefix
                                  const seatId = `${prefix}${rowData.row}${seatNumber}`;
                                  
                                  const isUserReservation = userReservations.some(
                                    (reservation) => {
                                      if (reservation.showId !== parseInt(showId))
                                        return false;
                                        
                                      // In admin mode, check if this seat belongs to the reservation we're editing
                                      if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                        return false;
                                      }

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(reservation.seatNumbers)
                                              : reservation.seatNumbers
                                                  .split(",")
                                                  .map((s) => s.trim())
                                            : reservation.seatNumbers || [];

                                        return (
                                          Array.isArray(seats) &&
                                          seats.includes(seatId)
                                        );
                                      } catch (e) {
                                        console.error(
                                          "Error parsing user reservation seats:",
                                          e,
                                        );
                                        return false;
                                      }
                                    },
                                  );

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                      isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={onSeatSelect}
                                    />
                                  );
                                })}
                              </div>
                              
                              {/* Aisle */}
                              <div className="w-2"></div>
                              
                              {/* Second group (5-8) */}
                              <div className="flex gap-1 mr-2">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 5;
                                  const prefix = "R"; // Back section prefix
                                  const seatId = `${prefix}${rowData.row}${seatNumber}`;
                                  
                                  const isUserReservation = userReservations.some(
                                    (reservation) => {
                                      if (reservation.showId !== parseInt(showId))
                                        return false;
                                        
                                      // In admin mode, check if this seat belongs to the reservation we're editing
                                      if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                        return false;
                                      }

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(reservation.seatNumbers)
                                              : reservation.seatNumbers
                                                  .split(",")
                                                  .map((s) => s.trim())
                                            : reservation.seatNumbers || [];

                                        return (
                                          Array.isArray(seats) &&
                                          seats.includes(seatId)
                                        );
                                      } catch (e) {
                                        console.error(
                                          "Error parsing user reservation seats:",
                                          e,
                                        );
                                        return false;
                                      }
                                    },
                                  );

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                      isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={onSeatSelect}
                                    />
                                  );
                                })}
                              </div>
                              
                              {/* Aisle */}
                              <div className="w-2"></div>
                              
                              {/* Third group (9-12) */}
                              <div className="flex gap-1 mr-2">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 9;
                                  const prefix = "R"; // Back section prefix
                                  const seatId = `${prefix}${rowData.row}${seatNumber}`;
                                  
                                  const isUserReservation = userReservations.some(
                                    (reservation) => {
                                      if (reservation.showId !== parseInt(showId))
                                        return false;
                                        
                                      // In admin mode, check if this seat belongs to the reservation we're editing
                                      if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                        return false;
                                      }

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(reservation.seatNumbers)
                                              : reservation.seatNumbers
                                                  .split(",")
                                                  .map((s) => s.trim())
                                            : reservation.seatNumbers || [];

                                        return (
                                          Array.isArray(seats) &&
                                          seats.includes(seatId)
                                        );
                                      } catch (e) {
                                        console.error(
                                          "Error parsing user reservation seats:",
                                          e,
                                        );
                                        return false;
                                      }
                                    },
                                  );

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                      isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={onSeatSelect}
                                    />
                                  );
                                })}
                              </div>
                              
                              {/* Aisle */}
                              <div className="w-2"></div>
                              
                              {/* Fourth group (13-16) */}
                              <div className="flex gap-1">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 13;
                                  const prefix = "R"; // Back section prefix
                                  const seatId = `${prefix}${rowData.row}${seatNumber}`;
                                  
                                  const isUserReservation = userReservations.some(
                                    (reservation) => {
                                      if (reservation.showId !== parseInt(showId))
                                        return false;
                                        
                                      // In admin mode, check if this seat belongs to the reservation we're editing
                                      if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                        return false;
                                      }

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(reservation.seatNumbers)
                                              : reservation.seatNumbers
                                                  .split(",")
                                                  .map((s) => s.trim())
                                            : reservation.seatNumbers || [];

                                        return (
                                          Array.isArray(seats) &&
                                          seats.includes(seatId)
                                        );
                                      } catch (e) {
                                        console.error(
                                          "Error parsing user reservation seats:",
                                          e,
                                        );
                                        return false;
                                      }
                                    },
                                  );

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                      isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={onSeatSelect}
                                    />
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </>
                      )}
                      
                      {/* Balcony section with 3 groups of 3 seats */}
                      {section.section === "Balcony" && (
                        <>
                          {/* First group (1-3) */}
                          <div className="flex gap-1 mr-2">
                            {Array.from({ length: 3 }).map((_, idx) => {
                              const seatNumber = idx + 1;
                              const prefix = "B"; // Balcony section prefix
                              const seatId = `${prefix}${rowData.row}${seatNumber}`;
                              
                              const isUserReservation = userReservations.some(
                                (reservation) => {
                                  if (reservation.showId !== parseInt(showId))
                                    return false;
                                    
                                  // In admin mode, check if this seat belongs to the reservation we're editing
                                  if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                    return false;
                                  }

                                  try {
                                    const seats =
                                      typeof reservation.seatNumbers === "string"
                                        ? reservation.seatNumbers.startsWith("[")
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers
                                              .split(",")
                                              .map((s) => s.trim())
                                        : reservation.seatNumbers || [];

                                    return Array.isArray(seats) && seats.includes(seatId);
                                  } catch (e) {
                                    console.error("Error parsing user reservation seats:", e);
                                    return false;
                                  }
                                },
                              );

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                  isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={onSeatSelect}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Gap between groups */}
                          <div className="w-2 sm:w-3 md:w-4"></div>
                          
                          {/* Second group (5-7) */}
                          <div className="flex gap-1 mr-2">
                            {Array.from({ length: 3 }).map((_, idx) => {
                              const seatNumber = idx + 5;
                              const prefix = "B"; // Balcony section prefix
                              const seatId = `${prefix}${rowData.row}${seatNumber}`;
                              
                              const isUserReservation = userReservations.some(
                                (reservation) => {
                                  if (reservation.showId !== parseInt(showId))
                                    return false;
                                    
                                  // In admin mode, check if this seat belongs to the reservation we're editing
                                  if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                    return false;
                                  }

                                  try {
                                    const seats =
                                      typeof reservation.seatNumbers === "string"
                                        ? reservation.seatNumbers.startsWith("[")
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers
                                              .split(",")
                                              .map((s) => s.trim())
                                        : reservation.seatNumbers || [];

                                    return Array.isArray(seats) && seats.includes(seatId);
                                  } catch (e) {
                                    console.error("Error parsing user reservation seats:", e);
                                    return false;
                                  }
                                },
                              );

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                  isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={onSeatSelect}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Gap between groups */}
                          <div className="w-2 sm:w-3 md:w-4"></div>
                          
                          {/* Third group (9-11) */}
                          <div className="flex gap-1">
                            {Array.from({ length: 3 }).map((_, idx) => {
                              const seatNumber = idx + 9;
                              const prefix = "B"; // Balcony section prefix
                              const seatId = `${prefix}${rowData.row}${seatNumber}`;
                              
                              const isUserReservation = userReservations.some(
                                (reservation) => {
                                  if (reservation.showId !== parseInt(showId))
                                    return false;
                                    
                                  // In admin mode, check if this seat belongs to the reservation we're editing
                                  if (isAdminMode && currentUserId && reservation.userId !== currentUserId) {
                                    return false;
                                  }

                                  try {
                                    const seats =
                                      typeof reservation.seatNumbers === "string"
                                        ? reservation.seatNumbers.startsWith("[")
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers
                                              .split(",")
                                              .map((s) => s.trim())
                                        : reservation.seatNumbers || [];

                                    return Array.isArray(seats) && seats.includes(seatId);
                                  } catch (e) {
                                    console.error("Error parsing user reservation seats:", e);
                                    return false;
                                  }
                                },
                              );

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId) && !isUserReservation}
                                  isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={onSeatSelect}
                                />
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right exits */}
                    {section.section === "Back" && rowData.row === "G" ? (
                      <Exit position="right" />
                    ) : section.section === "Balcony" && rowData.row === "O" ? (
                      <div className="w-[62px]">
                        <Exit position="right" />
                      </div>
                    ) : (
                      /* For all other rows, add a placeholder for alignment */
                      <div className="w-[62px]"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      {!hideActionButtons && (
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          <div className="flex gap-2 items-center text-sm">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-primary border-2 border-primary rounded"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
              <span>Your Reservation</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-200 rounded"></div>
              <span>Blocked</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              disabled={reserveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => reserveMutation.mutate()}
              disabled={
                selectedSeats.length === 0 ||
                reserveMutation.isPending ||
                isPastCutoffTime ||
                hasExistingReservation
              }
            >
              {reserveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reserve Seats ({selectedSeats.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}