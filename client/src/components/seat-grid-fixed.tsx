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
      <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-md border border-red-600">
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

  console.log(show?.seatLayout);

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

  // Function to check if a seat is in the user's reservation for the current show
  const isUserSeat = (seatId: string) => {
    return userReservations.some(reservation => {
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
        {/* Sections Layout */}
        {layout.map((section: any) => (
          <div key={section.section} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {section.section}
              <span className="text-sm text-muted-foreground font-normal">
                {section.section === "Balcony" 
                  ? "(Prefix: B)" 
                  : section.section === "Back Section"
                    ? "(Prefix: R)" // Corrected prefix for Back Section
                    : "(Prefix: F)" // Corrected prefix for Front Section
                }
              </span>
            </h3>
            
            <div className="w-full bg-muted/30 p-8 rounded-lg shadow-inner overflow-x-auto lg:overflow-visible">
              <div className="space-y-3 w-full">
                {/* Section headers */}
                {section.section === "Balcony" && (
                  <div className="flex justify-center mb-4">
                    <div className="text-sm text-muted-foreground py-1 px-3 bg-muted/50 rounded-md">
                      UPSTAIRS BALCONY (2 rows with 9 seats each - evenly spaced aisles after seats 3 and 7)
                    </div>
                  </div>
                )}
                
                {section.section === "Back Section" && (
                  <div className="flex justify-center mb-4">
                    <div className="text-sm text-muted-foreground py-1 px-3 bg-muted/50 rounded-md">
                      BACK SECTION (rows G-N, aisles after seats 4 and 9, server room at row M seats 5-8)
                    </div>
                  </div>
                )}
                
                {section.section === "Front Section" && (
                  <div className="flex justify-center mb-4">
                    <div className="text-sm text-muted-foreground py-1 px-3 bg-muted/50 rounded-md">
                      FRONT SECTION (rows A-F, central aisle between seats 9 and 10, evenly spaced)
                    </div>
                  </div>
                )}

                {/* Reverse rows for proper alphabetical ordering during rendering */}
                {[...section.rows].reverse().map((rowData: any) => (
                  <div key={rowData.row} className="flex gap-3 justify-center">
                    {/* Exit on left for specific rows */}
                    {section.section === "Balcony" && rowData.row === "A" ? (
                      <div className="flex items-center">
                        <Exit position="left" />
                        <div className="text-center text-xs text-muted-foreground ml-1">EXIT</div>
                      </div>
                    ) : (
                      /* For all other rows, add a placeholder for alignment */
                      <div className="w-[62px]"></div>
                    )}
                    
                    {/* Row label (left side) */}
                    <span className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                      {rowData.row}
                    </span>

                    {/* SEAT LAYOUT - Direct mapping from the database structure */}
                    <div className="flex flex-nowrap">
                      {rowData.seats.map((seatNum: number, index: number) => {
                        // Determine prefix based on section
                        let prefix = "X"; // Default placeholder
                        if (section.section === "Balcony") {
                          prefix = "B";
                        } else if (section.section === "Back Section") {
                          prefix = "R"; // Rear section prefix
                        } else if (section.section === "Front Section") {
                          prefix = "F"; // Front section prefix
                        }
                        
                        const seatId = `${prefix}${rowData.row}${seatNum}`;
                        
                        // Special case: Server Room (Row M, seats 5-8)
                        if (section.section === "Back Section" && rowData.row === "M" && seatNum === 5) {
                          return (
                            <div key={`server-room`} className="flex items-center">
                              <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm w-[100px]">
                                SERVER ROOM
                              </div>
                            </div>
                          );
                        }
                        
                        // Skip other server room seats (they're not in the seats array, but just to be safe)
                        if (section.section === "Back Section" && rowData.row === "M" && seatNum >= 5 && seatNum <= 8) {
                          return null;
                        }
                        
                        // Check if we need to add an aisle after this seat
                        let needsAisle = false;
                        
                        if (section.section === "Balcony" && (seatNum === 3 || seatNum === 7)) {
                          needsAisle = true;
                        }
                        
                        if (section.section === "Back Section" && (seatNum === 4 || seatNum === 9)) {
                          needsAisle = true;
                        }
                        
                        if (section.section === "Front Section" && seatNum === 9) {
                          needsAisle = true;
                        }
                        
                        return (
                          <div key={seatId} className="flex items-center">
                            <Seat
                              seatId={seatId}
                              isReserved={reservedSeats.has(seatId)}
                              isBlocked={blockedSeats.has(seatId)}
                              isSelected={selectedSeats.includes(seatId)}
                              isUserReservation={isUserSeat(seatId)}
                              onSelect={handleSeatSelect}
                            />
                            {needsAisle && <div className="w-8 h-12 mx-1"></div>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Row label (right side) */}
                    <span className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                      {rowData.row}
                    </span>

                    {/* Exits on the right side - no exits on right side as per requirements */}
                    <div className="w-[62px]"></div>
                  </div>
                ))}

                {/* Exits between front and rear sections */}
                {section.section === "Back Section" && section.rows[section.rows.length - 1].row === "G" && (
                  <div className="flex justify-between mt-4 w-full px-16">
                    {/* Left exit near left aisle */}
                    <div className="flex items-center">
                      <Exit position="bottom" />
                      <div className="text-center text-xs text-muted-foreground my-2 mx-2">EXIT</div>
                    </div>
                    
                    {/* Center indicator */}
                    <div className="text-center text-xs text-muted-foreground my-2">
                      ROW DIVIDER BETWEEN F & G
                    </div>
                    
                    {/* Right exit near right aisle */}
                    <div className="flex items-center">
                      <div className="text-center text-xs text-muted-foreground my-2 mx-2">EXIT</div>
                      <Exit position="bottom" />
                    </div>
                  </div>
                )}

                {/* Exits between screen and first row */}
                {section.section === "Front Section" && section.rows[section.rows.length - 1].row === "A" && (
                  <div className="flex justify-between mt-4 mb-8 w-full px-16">
                    {/* Left exit near left aisle */}
                    <div className="flex items-center">
                      <Exit position="bottom" />
                      <div className="text-center text-xs text-muted-foreground my-2 mx-2">EXIT</div>
                    </div>
                    
                    {/* Center indicator */}
                    <div className="text-center text-xs text-muted-foreground my-2">
                      SPACE BETWEEN ROW A & SCREEN
                    </div>
                    
                    {/* Right exit near right aisle */}
                    <div className="flex items-center">
                      <div className="text-center text-xs text-muted-foreground my-2 mx-2">EXIT</div>
                      <Exit position="bottom" />
                    </div>
                  </div>
                )}

                {/* Screen for Front Section */}
                {section.section === "Front Section" && (
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