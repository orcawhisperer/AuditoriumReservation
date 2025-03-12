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

type SeatProps = {
  seatId: string;
  isReserved: boolean;
  isBlocked: boolean;
  isSelected: boolean;
  onSelect: (seatId: string) => void;
};

function Seat({ seatId, isReserved, isBlocked, isSelected, onSelect }: SeatProps) {
  return (
    <button
      className={cn(
        "w-8 h-8 rounded border-2 text-xs font-medium transition-colors shadow-sm",
        isReserved && "bg-red-100 border-red-200 text-red-500 cursor-not-allowed",
        isBlocked && "bg-yellow-100 border-yellow-200 text-yellow-500 cursor-not-allowed",
        isSelected && "bg-primary border-primary text-primary-foreground",
        !isReserved && !isBlocked && !isSelected && "hover:bg-accent hover:border-accent hover:text-accent-foreground active:scale-95"
      )}
      disabled={isReserved || isBlocked}
      onClick={() => onSelect(seatId)}
    >
      {seatId.slice(1)} {/* Remove section prefix for display */}
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

  // Add staleTime: 0 to ensure fresh data on each query
  const { data: showReservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: [`/api/reservations/show/${showId}`],
    enabled: !!showId,
    staleTime: 0,
  });

  const { data: userReservations = [], isLoading: userReservationsLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations/user"],
    staleTime: 0,
  });

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

  const layout = JSON.parse(show.seatLayout);
  const reservedSeats = new Set(showReservations.flatMap((r) => JSON.parse(r.seatNumbers)));
  const blockedSeats = new Set(JSON.parse(show.blockedSeats || '[]'));

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
        {layout.map((section: any) => (
          <div key={section.section} className="space-y-4">
            <h3 className="text-lg font-semibold">{section.section}</h3>
            <div className="w-full bg-muted/30 p-8 rounded-lg shadow-inner overflow-x-auto">
              <div className="space-y-3 min-w-fit">
                {section.rows.map((rowData: any) => (
                  <div key={rowData.row} className="flex gap-3 justify-center">
                    <span className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                      {rowData.row}
                    </span>
                    <div className="flex gap-3">
                      {Array.from({ length: Math.max(...rowData.seats) }).map((_, seatIndex) => {
                        const seatNumber = seatIndex + 1;
                        // Add section prefix to seat ID
                        const seatId = `${section.prefix}${rowData.row}${seatNumber}`;
                        // Only render seats that exist in this row
                        if (!rowData.seats.includes(seatNumber)) {
                          return <div key={seatId} className="w-8" />;
                        }
                        return (
                          <Seat
                            key={seatId}
                            seatId={seatId}
                            isReserved={reservedSeats.has(seatId)}
                            isBlocked={blockedSeats.has(seatId)}
                            isSelected={selectedSeats.includes(seatId)}
                            onSelect={handleSeatSelect}
                          />
                        );
                      })}
                    </div>
                    <span className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                      {rowData.row}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

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
              <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-200" />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-200" />
              <span>Blocked</span>
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