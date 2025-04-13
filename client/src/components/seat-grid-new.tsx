import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Reservation, Show, insertReservationSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";

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
        "w-8 h-8 rounded border-2 text-xs font-medium transition-colors shadow-sm",
        isUserReservation && 
          "bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed",
        isReserved && !isUserReservation &&
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
function Exit({ position }: { position: "left" | "right" | "top" | "bottom" }) {
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

export function SeatGrid() {
  const [, setLocation] = useLocation();
  const { showId } = useParams<{ showId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const { t } = useTranslation();

  const { data: show, isLoading: showLoading } = useQuery<Show>({
    queryKey: [`/api/shows/${showId}`],
  });

  const { data: showReservations = [], isLoading: reservationsLoading } =
    useQuery<Reservation[]>({
      queryKey: [`/api/reservations/show/${showId}`],
      enabled: !!showId,
      staleTime: 0,
    });

  const { data: userReservations = [], isLoading: userReservationsLoading } =
    useQuery<Reservation[]>({
      queryKey: ["/api/reservations/user"],
      staleTime: 0,
    });

  const hasExistingReservation = userReservations.some(
    (reservation) => reservation.showId === parseInt(showId),
  );
  
  // Check if the show time is within 30 minutes from now
  const isPastCutoffTime = useMemo(() => {
    if (!show) return false;
    
    const showTime = new Date(show.date);
    const cutoffTime = new Date(showTime.getTime() - 30 * 60 * 1000); // 30 minutes before show
    const now = new Date();
    
    return now > cutoffTime;
  }, [show]);

  // Additional blocked seats function - for balcony row O special case
  const isSpecialBlockedSeat = (section: string, row: string, seatNumber: number) => {
    // Block seats 4, 8, 12 in balcony row O
    return section === "Balcony" && row === "O" && [4, 8, 12].includes(seatNumber);
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

  if (showLoading || reservationsLoading || userReservationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!show) {
    return <div>Show not found</div>;
  }

  const layout = typeof show.seatLayout === 'string' 
    ? JSON.parse(show.seatLayout) 
    : show.seatLayout;
    
  const reservedSeats = new Set(
    showReservations.flatMap((r) => {
      try {
        return typeof r.seatNumbers === 'string' 
          ? (r.seatNumbers.startsWith('[') 
              ? JSON.parse(r.seatNumbers) 
              : r.seatNumbers.split(',').map(s => s.trim()))
          : Array.isArray(r.seatNumbers) 
              ? r.seatNumbers 
              : [];
      } catch (e) {
        console.error("Error parsing seat numbers:", e);
        return [];
      }
    })
  );
  
  const blockedSeats = new Set(
    Array.isArray(show.blockedSeats)
      ? show.blockedSeats
      : (typeof show.blockedSeats === 'string'
          ? (show.blockedSeats.startsWith('[') 
              ? JSON.parse(show.blockedSeats)
              : show.blockedSeats.split(',').map(s => s.trim()))
          : [])
  );

  const handleSeatSelect = (seatId: string) => {
    // If the seat is already selected, remove it (toggle off)
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
      return;
    }
    
    // Trying to add a new seat
    
    // Admins have no seat limit
    if (!user?.isAdmin) {
      const seatLimit = user?.seatLimit || 4;
      if (selectedSeats.length >= seatLimit) {
        toast({
          title: "Maximum seats reached",
          description: `You can only reserve up to ${seatLimit} seats`,
          variant: "destructive",
        });
        // Don't modify the selection
        return;
      }
    }
    
    // Add the new seat and sort the array
    setSelectedSeats([...selectedSeats, seatId].sort());
  };

  const seatLimit = user?.seatLimit || 4;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{show.title}</h2>
          <span className="text-sm text-muted-foreground bg-primary/10 px-2 py-1 rounded">Shahbaaz Auditorium</span>
        </div>
        <p className="text-muted-foreground">
          {format(new Date(show.date), "PPP")} at{" "}
          {format(new Date(show.date), "p")}
        </p>
        <p className="mt-2 text-sm border rounded-md p-2 bg-accent/20 inline-block">
          {user?.isAdmin ? (
            <>As an admin, you can book <strong>unlimited</strong> seats.</>
          ) : (
            <>You can book up to <strong>{seatLimit}</strong> seats for this show.</>
          )}
        </p>
        
        {/* Cutoff time alert */}
        {isPastCutoffTime && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Reservation Cutoff Time</AlertTitle>
            <AlertDescription>
              Online reservations are closed 30 minutes before the show starts.
              Please contact the admin at the venue for last-minute reservations.
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

      <div className="space-y-6">
        {/* Render all sections based on the new layout */}
        {layout.map((section: any) => (
          <div key={section.section} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {section.section}
              <span className="text-sm text-muted-foreground font-normal">
                {section.section === "Balcony" ? "(Prefix: B)" : 
                 section.section === "Back" ? "(Prefix: R)" : 
                 "(Prefix: F)"}
              </span>
            </h3>
            <div className="w-full bg-muted/30 p-8 rounded-lg shadow-inner overflow-x-auto">
              <div className="space-y-3 min-w-fit">
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
                  <div key={rowData.row} className="flex gap-3 justify-center">
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

                    <div className="flex flex-wrap gap-1 relative">
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
                              const isUserReservation = userReservations.some(reservation => {
                                if (reservation.showId !== parseInt(showId)) return false;
                                
                                try {
                                  const seats = typeof reservation.seatNumbers === 'string'
                                    ? (reservation.seatNumbers.startsWith('[')
                                      ? JSON.parse(reservation.seatNumbers)
                                      : reservation.seatNumbers.split(',').map(s => s.trim()))
                                    : reservation.seatNumbers || [];
                                  
                                  return Array.isArray(seats) && seats.includes(seatId);
                                } catch (e) {
                                  console.error("Error parsing user reservation seats:", e);
                                  return false;
                                }
                              });

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId)}
                                  isBlocked={blockedSeats.has(seatId)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={handleSeatSelect}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Center aisle */}
                          <div className="w-4"></div>
                          
                          {/* Second half (10-18) */}
                          <div className="flex gap-1">
                            {Array.from({ length: 9 }).map((_, idx) => {
                              const seatNumber = idx + 10;
                              const prefix = "F"; // Front section prefix
                              const seatId = `${prefix}${rowData.row}${seatNumber}`;
                              
                              const isUserReservation = userReservations.some(reservation => {
                                if (reservation.showId !== parseInt(showId)) return false;
                                
                                try {
                                  const seats = typeof reservation.seatNumbers === 'string'
                                    ? (reservation.seatNumbers.startsWith('[')
                                      ? JSON.parse(reservation.seatNumbers)
                                      : reservation.seatNumbers.split(',').map(s => s.trim()))
                                    : reservation.seatNumbers || [];
                                  
                                  return Array.isArray(seats) && seats.includes(seatId);
                                } catch (e) {
                                  console.error("Error parsing user reservation seats:", e);
                                  return false;
                                }
                              });

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId)}
                                  isBlocked={blockedSeats.has(seatId)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={handleSeatSelect}
                                />
                              );
                            })}
                          </div>
                        </>
                      )}
                      
                      {/* Back section with 4 groups of 4 seats */}
                      {section.section === "Back" && (
                        <>
                          {/* Special case for row N with server room */}
                          {rowData.row === "N" ? (
                            <>
                              {/* First group (1-4) */}
                              <div className="flex gap-1 mr-2">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 1;
                                  const prefix = "R"; // Back section prefix
                                  const seatId = `${prefix}${rowData.row}${seatNumber}`;
                                  
                                  const isUserReservation = userReservations.some(reservation => {
                                    if (reservation.showId !== parseInt(showId)) return false;
                                    
                                    try {
                                      const seats = typeof reservation.seatNumbers === 'string'
                                        ? (reservation.seatNumbers.startsWith('[')
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers.split(',').map(s => s.trim()))
                                        : reservation.seatNumbers || [];
                                      
                                      return Array.isArray(seats) && seats.includes(seatId);
                                    } catch (e) {
                                      console.error("Error parsing user reservation seats:", e);
                                      return false;
                                    }
                                  });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
                                    />
                                  );
                                })}
                              </div>
                              
                              {/* Server room placeholder with better alignment */}
                              <div className="flex items-center justify-center mx-2 px-2 bg-gray-300 rounded text-xs text-gray-600 h-8 font-medium w-[132px]">
                                Server Room
                              </div>
                              
                              {/* Third and fourth groups (9-16) */}
                              <div className="flex gap-1 ml-2">
                                {Array.from({ length: 8 }).map((_, idx) => {
                                  const seatNumber = idx + 9;
                                  const prefix = "R"; // Back section prefix
                                  const seatId = `${prefix}${rowData.row}${seatNumber}`;
                                  
                                  const isUserReservation = userReservations.some(reservation => {
                                    if (reservation.showId !== parseInt(showId)) return false;
                                    
                                    try {
                                      const seats = typeof reservation.seatNumbers === 'string'
                                        ? (reservation.seatNumbers.startsWith('[')
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers.split(',').map(s => s.trim()))
                                        : reservation.seatNumbers || [];
                                      
                                      return Array.isArray(seats) && seats.includes(seatId);
                                    } catch (e) {
                                      console.error("Error parsing user reservation seats:", e);
                                      return false;
                                    }
                                  });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
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
                                  
                                  const isUserReservation = userReservations.some(reservation => {
                                    if (reservation.showId !== parseInt(showId)) return false;
                                    
                                    try {
                                      const seats = typeof reservation.seatNumbers === 'string'
                                        ? (reservation.seatNumbers.startsWith('[')
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers.split(',').map(s => s.trim()))
                                        : reservation.seatNumbers || [];
                                      
                                      return Array.isArray(seats) && seats.includes(seatId);
                                    } catch (e) {
                                      console.error("Error parsing user reservation seats:", e);
                                      return false;
                                    }
                                  });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
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
                                  
                                  const isUserReservation = userReservations.some(reservation => {
                                    if (reservation.showId !== parseInt(showId)) return false;
                                    
                                    try {
                                      const seats = typeof reservation.seatNumbers === 'string'
                                        ? (reservation.seatNumbers.startsWith('[')
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers.split(',').map(s => s.trim()))
                                        : reservation.seatNumbers || [];
                                      
                                      return Array.isArray(seats) && seats.includes(seatId);
                                    } catch (e) {
                                      console.error("Error parsing user reservation seats:", e);
                                      return false;
                                    }
                                  });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
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
                                  
                                  const isUserReservation = userReservations.some(reservation => {
                                    if (reservation.showId !== parseInt(showId)) return false;
                                    
                                    try {
                                      const seats = typeof reservation.seatNumbers === 'string'
                                        ? (reservation.seatNumbers.startsWith('[')
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers.split(',').map(s => s.trim()))
                                        : reservation.seatNumbers || [];
                                      
                                      return Array.isArray(seats) && seats.includes(seatId);
                                    } catch (e) {
                                      console.error("Error parsing user reservation seats:", e);
                                      return false;
                                    }
                                  });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
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
                                  
                                  const isUserReservation = userReservations.some(reservation => {
                                    if (reservation.showId !== parseInt(showId)) return false;
                                    
                                    try {
                                      const seats = typeof reservation.seatNumbers === 'string'
                                        ? (reservation.seatNumbers.startsWith('[')
                                          ? JSON.parse(reservation.seatNumbers)
                                          : reservation.seatNumbers.split(',').map(s => s.trim()))
                                        : reservation.seatNumbers || [];
                                      
                                      return Array.isArray(seats) && seats.includes(seatId);
                                    } catch (e) {
                                      console.error("Error parsing user reservation seats:", e);
                                      return false;
                                    }
                                  });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(seatId)}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
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
                              
                              const isUserReservation = userReservations.some(reservation => {
                                if (reservation.showId !== parseInt(showId)) return false;
                                
                                try {
                                  const seats = typeof reservation.seatNumbers === 'string'
                                    ? (reservation.seatNumbers.startsWith('[')
                                      ? JSON.parse(reservation.seatNumbers)
                                      : reservation.seatNumbers.split(',').map(s => s.trim()))
                                    : reservation.seatNumbers || [];
                                  
                                  return Array.isArray(seats) && seats.includes(seatId);
                                } catch (e) {
                                  console.error("Error parsing user reservation seats:", e);
                                  return false;
                                }
                              });

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId)}
                                  isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={handleSeatSelect}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Gap between groups */}
                          <div className="w-2"></div>
                          
                          {/* Second group (5-7) */}
                          <div className="flex gap-1 mr-2">
                            {Array.from({ length: 3 }).map((_, idx) => {
                              const seatNumber = idx + 5;
                              const prefix = "B"; // Balcony section prefix
                              const seatId = `${prefix}${rowData.row}${seatNumber}`;
                              
                              const isUserReservation = userReservations.some(reservation => {
                                if (reservation.showId !== parseInt(showId)) return false;
                                
                                try {
                                  const seats = typeof reservation.seatNumbers === 'string'
                                    ? (reservation.seatNumbers.startsWith('[')
                                      ? JSON.parse(reservation.seatNumbers)
                                      : reservation.seatNumbers.split(',').map(s => s.trim()))
                                    : reservation.seatNumbers || [];
                                  
                                  return Array.isArray(seats) && seats.includes(seatId);
                                } catch (e) {
                                  console.error("Error parsing user reservation seats:", e);
                                  return false;
                                }
                              });

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId)}
                                  isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={handleSeatSelect}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Gap between groups */}
                          <div className="w-2"></div>
                          
                          {/* Third group (9-11) */}
                          <div className="flex gap-1">
                            {Array.from({ length: 3 }).map((_, idx) => {
                              const seatNumber = idx + 9;
                              const prefix = "B"; // Balcony section prefix
                              const seatId = `${prefix}${rowData.row}${seatNumber}`;
                              
                              const isUserReservation = userReservations.some(reservation => {
                                if (reservation.showId !== parseInt(showId)) return false;
                                
                                try {
                                  const seats = typeof reservation.seatNumbers === 'string'
                                    ? (reservation.seatNumbers.startsWith('[')
                                      ? JSON.parse(reservation.seatNumbers)
                                      : reservation.seatNumbers.split(',').map(s => s.trim()))
                                    : reservation.seatNumbers || [];
                                  
                                  return Array.isArray(seats) && seats.includes(seatId);
                                } catch (e) {
                                  console.error("Error parsing user reservation seats:", e);
                                  return false;
                                }
                              });

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId)}
                                  isBlocked={blockedSeats.has(seatId) || isSpecialBlockedSeat(section.section, rowData.row, seatNumber)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={handleSeatSelect}
                                />
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    <span className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                      {rowData.row}
                    </span>

                    {/* Exits on the right side */}
                    {section.section === "Back" && rowData.row === "G" ? (
                      <Exit position="right" />
                    ) : (
                      <div className="w-[62px]"></div>
                    )}
                  </div>
                ))}

                {/* Exits between Front and Back sections */}
                {section.section === "Front" && (
                  <div className="flex justify-between mt-4">
                    <Exit position="left" />
                    <div className="flex-grow"></div>
                    <Exit position="right" />
                  </div>
                )}

                {/* Screen for Front section */}
                {section.section === "Front" && (
                  <div className="mt-8 flex justify-center items-center">
                    <div className="w-1/3 h-1 bg-slate-300 rounded"></div>
                    <div className="px-4 py-1 border-2 border-primary/50 rounded text-sm font-bold mx-2">
                      SCREEN
                    </div>
                    <div className="w-1/3 h-1 bg-slate-300 rounded"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-6 items-center text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary border-2 border-primary" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300" />
              <span>Your Reservation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-200" />
              <span>Others' Reservation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-200" />
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-red-500 text-white px-1 py-0.5 rounded text-xs">
                EXIT
              </div>
              <span>Exit</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Selected: {selectedSeats.join(", ")}
            </p>
            <Button
              onClick={() => reserveMutation.mutate()}
              disabled={
                selectedSeats.length === 0 ||
                reserveMutation.isPending ||
                hasExistingReservation ||
                isPastCutoffTime
              }
              className="min-w-[120px]"
            >
              {reserveMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {hasExistingReservation
                ? "Already Reserved"
                : isPastCutoffTime
                ? "Booking Closed"
                : `Reserve (${selectedSeats.length})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}