import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Reservation, Show, insertReservationSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const ROWS = 10;
const SEATS_PER_ROW = 25;

type SeatProps = {
  row: number;
  seat: number;
  isReserved: boolean;
  isSelected: boolean;
  onSelect: (seatId: string) => void;
};

function Seat({ row, seat, isReserved, isSelected, onSelect }: SeatProps) {
  const seatId = `${String.fromCharCode(65 + row)}${seat + 1}`;

  return (
    <button
      className={cn(
        "w-8 h-8 rounded border-2 text-xs font-medium transition-colors shadow-sm",
        isReserved && "bg-muted border-muted-foreground/20 text-muted-foreground cursor-not-allowed",
        isSelected && "bg-primary border-primary text-primary-foreground",
        !isReserved && !isSelected && "hover:bg-accent hover:border-accent hover:text-accent-foreground active:scale-95"
      )}
      disabled={isReserved}
      onClick={() => onSelect(seatId)}
    >
      {seatId}
    </button>
  );
}

export function SeatGrid() {
  const [, setLocation] = useLocation();
  const { showId } = useParams<{ showId: string }>();
  const { toast } = useToast();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const { data: show, isLoading: showLoading } = useQuery<Show>({
    queryKey: [`/api/shows/${showId}`],
  });

  const { data: showReservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: [`/api/reservations/show/${showId}`],
    enabled: !!showId,
  });

  const { data: userReservations = [], isLoading: userReservationsLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations/user"],
  });

  // Check if user already has a reservation for this show
  const hasExistingReservation = userReservations.some(
    reservation => reservation.showId === parseInt(showId)
  );

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
      // Invalidate both show's reservations and user's reservations
      queryClient.invalidateQueries({ queryKey: [`/api/reservations/show/${showId}`] });
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

  const reservedSeats = new Set(
    showReservations.flatMap((r) => r.seatNumbers)
  );

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((current) => {
      if (current.includes(seatId)) {
        return current.filter((id) => id !== seatId);
      }
      if (current.length >= 4) {
        toast({
          title: "Maximum seats reached",
          description: "You can only reserve up to 4 seats",
          variant: "destructive",
        });
        return current;
      }
      return [...current, seatId].sort();
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">{show.title}</h2>
        <p className="text-muted-foreground">
          {format(new Date(show.date), "PPP")} at {format(new Date(show.date), "p")}
        </p>
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
        <div className="w-full bg-muted/30 p-8 rounded-lg shadow-inner overflow-x-auto">
          <div className="space-y-3 min-w-fit">
            {Array.from({ length: ROWS }).map((_, row) => (
              <div key={row} className="flex gap-3 justify-center">
                <span className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                  {String.fromCharCode(65 + row)}
                </span>
                {Array.from({ length: SEATS_PER_ROW }).map((_, seat) => {
                  const seatId = `${String.fromCharCode(65 + row)}${seat + 1}`;
                  return (
                    <Seat
                      key={seat}
                      row={row}
                      seat={seat}
                      isReserved={reservedSeats.has(seatId)}
                      isSelected={selectedSeats.includes(seatId)}
                      onSelect={handleSeatSelect}
                    />
                  );
                })}
                <span className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                  {String.fromCharCode(65 + row)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-6 items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary border-2 border-primary" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted border-2 border-muted-foreground/20" />
              <span>Reserved</span>
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
                hasExistingReservation
              }
              className="min-w-[120px]"
            >
              {reserveMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {hasExistingReservation
                ? "Already Reserved"
                : `Reserve (${selectedSeats.length})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}