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
import { useIsMobile } from "@/hooks/use-mobile";

type SeatProps = {
  seatId: string;
  isReserved: boolean;
  isBlocked: boolean;
  isSelected: boolean;
  isUserReservation: boolean; // Add this to indicate seats reserved by the current user
  onSelect: (seatId: string) => void;
  isAdminMode?: boolean; // Add this to allow seat unselection in admin mode
  seatType?: "plastic" | "regular"; // Add this to distinguish plastic seats
  isFafaExclusive?: boolean; // Add this to indicate FAFA exclusive seats
};

export function Seat({
  seatId,
  isReserved,
  isBlocked,
  isSelected,
  isUserReservation,
  onSelect,
  isAdminMode = false,
  seatType = "regular",
  isFafaExclusive = false
}: SeatProps) {
  // Extract seat number - handle special case for plastic seats with R1, R2, R3 rows
  const getSeatNumber = (id: string) => {
    // For plastic seats like "R11", "R21", "R31" - extract the last digit(s) after the row identifier
    if (id.match(/^R[123]\d+$/)) {
      // Remove "R1", "R2", or "R3" from the beginning and return the remaining number
      return id.replace(/^R[123]/, '');
    }
    // For other seats, extract the trailing number
    return id.match(/\d+$/)?.[0] || id;
  };
  
  const seatNumber = getSeatNumber(seatId);
  
  // In admin mode, we want to be able to select/unselect all seats including user reservations
  const isDisabled = isAdminMode 
    ? isBlocked // Only blocked seats are disabled in admin mode
    : (isReserved || isBlocked); // In normal mode, both reserved and blocked are disabled
    
  const getBaseStyles = () => {
    const baseSize = "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md border-2 text-xs font-medium transition-all duration-200 shadow-sm";
    
    if (seatType === "plastic") {
      return `${baseSize} bg-gradient-to-br from-violet-50 to-violet-100 border-violet-300 text-violet-700`;
    }
    if (isFafaExclusive) {
      return `${baseSize} bg-gradient-to-br from-orange-50 to-orange-100 border-[#ea8357] text-orange-800`;
    }
    return `${baseSize} bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 text-slate-700`;
  };

  return (
    <button
      className={cn(
        getBaseStyles(),
        
        // Your reservation - green theme
        isUserReservation && !isSelected && (isAdminMode ? false : true) &&
          "!bg-gradient-to-br !from-emerald-100 !to-emerald-200 !border-emerald-400 !text-emerald-800 !shadow-md",
        
        // Other users' reservations - red theme  
        isReserved &&
          !isUserReservation && !isSelected &&
          "!bg-gradient-to-br !from-red-100 !to-red-200 !border-red-400 !text-red-700 cursor-not-allowed !shadow-sm",
          
        // Blocked seats - gray theme
        isBlocked &&
          "!bg-gradient-to-br !from-gray-200 !to-gray-300 !border-gray-400 !text-gray-600 cursor-not-allowed opacity-75",
        
        // Selected seats - blue theme (overrides everything)
        isSelected && "!bg-gradient-to-br !from-blue-500 !to-blue-600 !border-blue-700 !text-white !font-bold !shadow-lg !ring-2 !ring-blue-300 !ring-offset-1",
        
        // Hover state - subtle lift effect
        !isDisabled &&
          !isSelected &&
          (isFafaExclusive 
            ? "hover:shadow-md hover:scale-105 hover:-translate-y-0.5 hover:!from-orange-100 hover:!to-orange-200 hover:!border-[#ea8357] hover:!text-orange-900 active:scale-100 active:translate-y-0"
            : seatType === "plastic"
            ? "hover:shadow-md hover:scale-105 hover:-translate-y-0.5 hover:!from-violet-100 hover:!to-violet-200 hover:!border-violet-400 hover:!text-violet-800 active:scale-100 active:translate-y-0"
            : "hover:shadow-md hover:scale-105 hover:-translate-y-0.5 hover:!from-slate-100 hover:!to-slate-200 hover:!border-slate-400 hover:!text-slate-800 active:scale-100 active:translate-y-0"),
      )}
      disabled={isDisabled}
      onClick={() => onSelect(seatId)}
      title={seatType === "plastic" ? 
        `Plastic Seat ${seatNumber}${isUserReservation ? " (Your reservation)" : ""}` : 
        isFafaExclusive ? 
          `FAFA-Exclusive Seat ${seatNumber}${isUserReservation ? " (Your reservation)" : ""}` :
          isUserReservation ? "User reservation" : ""
      }
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

export type SeatGridProps = { 
  showId?: string;
  selectedSeats?: string[];
  onSeatSelect?: (seatId: string) => void;
  userReservation?: any;
  hideActionButtons?: boolean;
  isAdminMode?: boolean;
  className?: string;
};

export function SeatGrid({ 
  showId: propShowId,
  selectedSeats: propSelectedSeats,
  onSeatSelect: propOnSeatSelect,
  userReservation: propUserReservation,
  hideActionButtons = false,
  isAdminMode = false,
  className,
}: SeatGridProps) {
  const [, setLocation] = useLocation();
  const params = useParams<{ showId: string }>();
  const urlShowId = params.showId;
  // Use prop showId if provided, otherwise use the one from URL params
  const showId = propShowId || urlShowId;
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [internalSelectedSeats, setInternalSelectedSeats] = useState<string[]>([]);
  // Use props selectedSeats if provided, otherwise use internal state
  const selectedSeats = propSelectedSeats || internalSelectedSeats;
  const { t } = useTranslation();
  const isMobile = useIsMobile();

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

  // Parse FAFA exclusive rows
  const fafaExclusiveRows = Array.isArray(show.fafaExclusiveRows)
    ? show.fafaExclusiveRows
    : typeof show.fafaExclusiveRows === "string"
      ? show.fafaExclusiveRows.startsWith("[")
        ? JSON.parse(show.fafaExclusiveRows)
        : show.fafaExclusiveRows.split(",").map((s) => s.trim()).filter(s => s)
      : [];

  console.log("FAFA Exclusive Rows:", fafaExclusiveRows, "Show data:", show.fafaExclusiveRows);
  console.log("Show object:", show);

  // Helper function to check if a seat is in a FAFA exclusive row
  const isFafaExclusiveSeat = (seatId: string) => {
    if (fafaExclusiveRows.length === 0) return false;
    
    // Extract row from seat ID (e.g., "A1" -> "A", "R11" -> "R1")
    let row = "";
    if (seatId.match(/^R[123]\d+$/)) {
      // Plastic seats: R11, R21, R31 -> R1, R2, R3
      row = seatId.substring(0, 2);
    } else {
      // Regular seats: A1, B2, etc. -> A, B, etc.
      row = seatId.charAt(0);
    }
    
    const isExclusive = fafaExclusiveRows.includes(row);
    console.log(`Checking seat ${seatId} with row '${row}' against FAFA rows:`, fafaExclusiveRows, 'Result:', isExclusive);
    if (isExclusive) {
      console.log(`Seat ${seatId} is FAFA exclusive (row: ${row}), user category: ${user?.category}`);
    }
    return isExclusive;
  };

  const handleSeatSelect = (seatId: string) => {
    // If we have an external seat selection handler, use it
    if (propOnSeatSelect) {
      propOnSeatSelect(seatId);
      return;
    }
    
    // Otherwise, handle seat selection internally
    // If the seat is already selected, remove it (toggle off)
    if (internalSelectedSeats.includes(seatId)) {
      setInternalSelectedSeats(internalSelectedSeats.filter((id) => id !== seatId));
      return;
    }

    // Trying to add a new seat

    // Admin users bypass all category restrictions
    if (!user?.isAdmin) {
      // Check FAFA exclusive row restrictions - non-FAFA users cannot select FAFA exclusive seats
      const userCategory = user?.category || "single";
      console.log(`Attempting to select seat ${seatId}, user category: ${userCategory}, is FAFA exclusive: ${isFafaExclusiveSeat(seatId)}`);
      
      if (isFafaExclusiveSeat(seatId) && userCategory !== "fafa") {
        toast({
          title: "FAFA-Exclusive Seat",
          description: `This seat is only available to FAFA category users. Your category: ${userCategory}`,
          variant: "destructive",
        });
        return;
      }

      // Check if user category is allowed for this show
      const allowedCategories = Array.isArray(show.allowedCategories)
        ? show.allowedCategories
        : typeof show.allowedCategories === "string"
          ? show.allowedCategories.startsWith("[")
            ? JSON.parse(show.allowedCategories)
            : show.allowedCategories.split(",").map((s) => s.trim()).filter(s => s)
          : ["single", "family", "fafa"];

      if (!allowedCategories.includes(userCategory)) {
        toast({
          title: "Category Not Allowed",
          description: `This show is not available for ${userCategory} category users`,
          variant: "destructive",
        });
        return;
      }
    }

    // Admins have no seat limit, but regular users are limited to 4 seats
    if (!user?.isAdmin) {
      const seatLimit = 4; // Fixed limit for non-admin users
      if (internalSelectedSeats.length >= seatLimit) {
        toast({
          title: "Maximum seats reached",
          description: `You can only reserve up to ${seatLimit} seats`,
          variant: "destructive",
        });
        return;
      }
    }

    // Add the new seat and sort the array
    setInternalSelectedSeats([...internalSelectedSeats, seatId].sort());
  };

  const seatLimit = user?.seatLimit || 4;

  // Use user reservations or provided reservation in admin mode
  const reservationsToUse = isAdminMode && propUserReservation ? [propUserReservation] : userReservations;
  
  // Helper function to render a seat consistently throughout the component
  const renderSeat = (seatId: string, isUserRes: boolean, seatType: "plastic" | "regular" = "regular") => {
    return (
      <Seat
        key={seatId}
        seatId={seatId}
        isReserved={reservedSeats.has(seatId)}
        isBlocked={blockedSeats.has(seatId)}
        isSelected={selectedSeats.includes(seatId)}
        isUserReservation={isUserRes}
        onSelect={handleSeatSelect}
        isAdminMode={isAdminMode}
        seatType={seatType}
        isFafaExclusive={isFafaExclusiveSeat(seatId)}
      />
    );
  };
  
  // Helper function to check if a seat is part of user reservation
  const checkIfUserReservation = (seatId: string) => {
    // Admin mode with specific reservation
    if (isAdminMode && propUserReservation) {
      try {
        const seatNums = typeof propUserReservation.seatNumbers === 'string'
          ? (propUserReservation.seatNumbers.startsWith('[')
            ? JSON.parse(propUserReservation.seatNumbers)
            : propUserReservation.seatNumbers.split(',').map((s: string) => s.trim()))
          : Array.isArray(propUserReservation.seatNumbers)
            ? propUserReservation.seatNumbers
            : [];
        
        return Array.isArray(seatNums) && seatNums.includes(seatId);
      } catch (e) {
        console.error("Error parsing admin user reservation seats:", e);
        return false;
      }
    }
    
    // Normal mode with user reservations
    return reservationsToUse.some((reservation) => {
      if (reservation.showId !== parseInt(showId))
        return false;

      try {
        const seats =
          typeof reservation.seatNumbers === "string"
            ? reservation.seatNumbers.startsWith("[")
              ? JSON.parse(reservation.seatNumbers)
              : reservation.seatNumbers.split(",").map((s: string) => s.trim())
            : reservation.seatNumbers || [];

        return Array.isArray(seats) && seats.includes(seatId);
      } catch (e) {
        console.error("Error parsing user reservation seats:", e);
        return false;
      }
    });
  };
  
  // We need to customize the rendering based on whether we're in admin mode or not
  // and whether we should hide certain parts of the UI
  return (
    <div className={`space-y-8 ${className || ''}`}>
      {!hideActionButtons && (
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
                    : section.section === "Front"
                      ? "(Prefix: F)"
                      : section.section === "Plastic"
                        ? "(Prefix: P) - Plastic Seats"
                        : ""}
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

                {/* Plastic section header */}
                {section.section === "Plastic" && (
                  <div className="flex justify-center mb-4">
                    <div className="text-sm text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded">
                      PLASTIC SEATS SECTION
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
                              const seatId = `${rowData.row}${seatNumber}`;

                              console.log(
                                "Seat ID:",
                                seatId,
                                show.blockedSeats,
                              );

                              // Check if this seat is reserved by the user
                              const isUserReservation = checkIfUserReservation(seatId);

                              return renderSeat(seatId, isUserReservation, "regular");
                            })}
                          </div>

                          {/* Center aisle */}
                          <div className="w-2 sm:w-3 md:w-4"></div>

                          {/* Second half (10-18) */}
                          <div className="flex gap-1">
                            {Array.from({ length: 9 }).map((_, idx) => {
                              const seatNumber = idx + 10;
                              const seatId = `${rowData.row}${seatNumber}`;

                              const isUserReservation = checkIfUserReservation(seatId);

                              return renderSeat(seatId, isUserReservation, "regular");
                            })}
                          </div>
                        </>
                      )}

                      {/* Plastic section with aisle in middle (9 seats on each side) - same layout as Front */}
                      {section.section === "Plastic" && (
                        <>
                          {/* First half (1-9) */}
                          <div className="flex gap-1 mr-4">
                            {Array.from({ length: 9 }).map((_, idx) => {
                              const seatNumber = idx + 1;
                              const seatId = `${rowData.row}${seatNumber}`;

                              // Check if this seat is reserved by the user
                              const isUserReservation = checkIfUserReservation(seatId);

                              return renderSeat(seatId, isUserReservation, "plastic");
                            })}
                          </div>

                          {/* Center aisle */}
                          <div className="w-2 sm:w-3 md:w-4"></div>

                          {/* Second half (10-18) */}
                          <div className="flex gap-1">
                            {Array.from({ length: 9 }).map((_, idx) => {
                              const seatNumber = idx + 10;
                              const seatId = `${rowData.row}${seatNumber}`;

                              // Check if this seat is reserved by the user
                              const isUserReservation = checkIfUserReservation(seatId);

                              return renderSeat(seatId, isUserReservation, "plastic");
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
                                  const seatId = `${rowData.row}${seatNumber}`;

                                  const isUserReservation =
                                    userReservations.some((reservation) => {
                                      if (
                                        reservation.showId !== parseInt(showId)
                                      )
                                        return false;

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(
                                                  reservation.seatNumbers,
                                                )
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
                                    });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(
                                        seatId,
                                      )}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
                                  isAdminMode={isAdminMode}
                                    />
                                  );
                                })}
                              </div>

                              {/* Server room placeholder with better alignment */}
                              <div className="flex items-center justify-center mx-2 px-2 bg-gray-300 rounded text-xs text-gray-600 h-8 font-medium w-[132px]">
                                Server Room
                              </div>

                              {/* Third group (9-12) */}
                              <div className="flex gap-1 ml-2 mr-2">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 9;
                                  const seatId = `${rowData.row}${seatNumber}`;

                                  const isUserReservation =
                                    userReservations.some((reservation) => {
                                      if (
                                        reservation.showId !== parseInt(showId)
                                      )
                                        return false;

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(
                                                  reservation.seatNumbers,
                                                )
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
                                    });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(
                                        seatId,
                                      )}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
                                  isAdminMode={isAdminMode}
                                    />
                                  );
                                })}
                              </div>

                              {/* Aisle */}
                              <div className="w-2 sm:w-3 md:w-4"></div>

                              {/* Fourth group (13-16) */}
                              <div className="flex gap-1">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 13;
                                  const seatId = `${rowData.row}${seatNumber}`;

                                  const isUserReservation =
                                    userReservations.some((reservation) => {
                                      if (
                                        reservation.showId !== parseInt(showId)
                                      )
                                        return false;

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(
                                                  reservation.seatNumbers,
                                                )
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
                                    });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(
                                        seatId,
                                      )}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
                                  isAdminMode={isAdminMode}
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
                                  const seatId = `${rowData.row}${seatNumber}`;

                                  const isUserReservation =
                                    userReservations.some((reservation) => {
                                      if (
                                        reservation.showId !== parseInt(showId)
                                      )
                                        return false;

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(
                                                  reservation.seatNumbers,
                                                )
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
                                    });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(
                                        seatId,
                                      )}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
                                  isAdminMode={isAdminMode}
                                    />
                                  );
                                })}
                              </div>

                              {/* Aisle */}
                              <div className="w-2 sm:w-3 md:w-4"></div>

                              {/* Second group (5-8) */}
                              <div className="flex gap-1 mr-2">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 5;
                                  const seatId = `${rowData.row}${seatNumber}`;

                                  const isUserReservation =
                                    userReservations.some((reservation) => {
                                      if (
                                        reservation.showId !== parseInt(showId)
                                      )
                                        return false;

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(
                                                  reservation.seatNumbers,
                                                )
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
                                    });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(
                                        seatId,
                                      )}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
                                  isAdminMode={isAdminMode}
                                    />
                                  );
                                })}
                              </div>

                              {/* Aisle */}
                              <div className="w-2 sm:w-3 md:w-4"></div>

                              {/* Third group (9-12) */}
                              <div className="flex gap-1 mr-2">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 9;
                                  const seatId = `${rowData.row}${seatNumber}`;

                                  const isUserReservation =
                                    userReservations.some((reservation) => {
                                      if (
                                        reservation.showId !== parseInt(showId)
                                      )
                                        return false;

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(
                                                  reservation.seatNumbers,
                                                )
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
                                    });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(
                                        seatId,
                                      )}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
                                  isAdminMode={isAdminMode}
                                    />
                                  );
                                })}
                              </div>

                              {/* Aisle */}
                              <div className="w-2 sm:w-3 md:w-4"></div>

                              {/* Fourth group (13-16) */}
                              <div className="flex gap-1">
                                {Array.from({ length: 4 }).map((_, idx) => {
                                  const seatNumber = idx + 13;
                                  const seatId = `${rowData.row}${seatNumber}`;

                                  const isUserReservation =
                                    userReservations.some((reservation) => {
                                      if (
                                        reservation.showId !== parseInt(showId)
                                      )
                                        return false;

                                      try {
                                        const seats =
                                          typeof reservation.seatNumbers ===
                                          "string"
                                            ? reservation.seatNumbers.startsWith(
                                                "[",
                                              )
                                              ? JSON.parse(
                                                  reservation.seatNumbers,
                                                )
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
                                    });

                                  return (
                                    <Seat
                                      key={seatId}
                                      seatId={seatId}
                                      isReserved={reservedSeats.has(seatId)}
                                      isBlocked={blockedSeats.has(seatId)}
                                      isSelected={selectedSeats.includes(
                                        seatId,
                                      )}
                                      isUserReservation={isUserReservation}
                                      onSelect={handleSeatSelect}
                                  isAdminMode={isAdminMode}
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
                              const seatId = `${rowData.row}${seatNumber}`;

                              const isUserReservation = userReservations.some(
                                (reservation) => {
                                  if (reservation.showId !== parseInt(showId))
                                    return false;

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
                                  isReserved={reservedSeats.has(seatId)}
                                  isBlocked={blockedSeats.has(seatId)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={handleSeatSelect}
                                  isAdminMode={isAdminMode}
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
                              const seatId = `${rowData.row}${seatNumber}`;

                              const isUserReservation = userReservations.some(
                                (reservation) => {
                                  if (reservation.showId !== parseInt(showId))
                                    return false;

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
                                  isReserved={reservedSeats.has(seatId)}
                                  isBlocked={
                                    blockedSeats.has(seatId) ||
                                    isSpecialBlockedSeat(
                                      section.section,
                                      rowData.row,
                                      seatNumber,
                                    )
                                  }
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={handleSeatSelect}
                                  isAdminMode={isAdminMode}
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
                              const seatId = `${rowData.row}${seatNumber}`;

                              const isUserReservation = userReservations.some(
                                (reservation) => {
                                  if (reservation.showId !== parseInt(showId))
                                    return false;

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
                                  isReserved={reservedSeats.has(seatId)}
                                  isBlocked={
                                    blockedSeats.has(seatId) ||
                                    isSpecialBlockedSeat(
                                      section.section,
                                      rowData.row,
                                      seatNumber,
                                    )
                                  }
                                  isSelected={selectedSeats.includes(seatId)}
                                  isUserReservation={isUserReservation}
                                  onSelect={handleSeatSelect}
                                  isAdminMode={isAdminMode}
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

                {/* Screen for Plastic section */}
                {section.section === "Plastic" && (
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
          <div className="flex gap-4 items-center text-sm flex-wrap">
            {/* Available Seats */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 shadow-sm" />
              <span className="font-medium text-slate-700">Available</span>
            </div>
            
            {/* Selected Seats */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-700 shadow-lg ring-1 ring-blue-300" />
              <span className="font-medium text-blue-700">Selected</span>
            </div>
            
            {/* Your Reservations */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-emerald-400 shadow-md" />
              <span className="font-medium text-emerald-700">Your Reservation</span>
            </div>
            
            {/* Others' Reservations */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-400 shadow-sm" />
              <span className="font-medium text-red-700">Others' Reservation</span>
            </div>
            
            {/* Blocked Seats */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-gray-400 opacity-75" />
              <span className="font-medium text-gray-600">Blocked</span>
            </div>
            
            {/* FAFA Exclusive */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-400 shadow-sm" />
              <span className="font-medium text-amber-700">FAFA Exclusive</span>
            </div>
            
            {/* Plastic Seats */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-50 to-violet-100 border-2 border-violet-300 shadow-sm" />  
              <span className="font-medium text-violet-700">Plastic Seats</span>
            </div>
            
            {/* Exit */}
            <div className="flex items-center gap-2">
              <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                EXIT
              </div>
              <span className="font-medium text-red-600">Exit</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {selectedSeats.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-blue-800">
                  Selected ({selectedSeats.length}): {selectedSeats.join(", ")}
                </p>
              </div>
            )}
            <Button
              onClick={() => reserveMutation.mutate()}
              disabled={
                selectedSeats.length === 0 ||
                reserveMutation.isPending ||
                hasExistingReservation ||
                isPastCutoffTime
              }
              className="min-w-[140px] bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
            >
              {reserveMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {hasExistingReservation
                ? "Already Reserved"
                : isPastCutoffTime
                  ? "Booking Closed"
                  : `Reserve ${selectedSeats.length} Seat${selectedSeats.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
