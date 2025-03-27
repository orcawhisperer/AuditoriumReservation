import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Show, Reservation } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

function ShowCard({
  show,
  reservations,
}: {
  show: Show;
  reservations: Reservation[];
}) {
  const [, setLocation] = useLocation();
  const isPastShow = new Date(show.date) < new Date();
  const hasReservation = reservations.some((r) => r.showId === show.id);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {show.poster && (
              <div className="relative w-full sm:w-24 md:w-32 overflow-hidden rounded-lg border">
                <div className="relative aspect-video">
                  <img
                    src={show.poster}
                    alt={`Poster for ${show.title}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            <div>
              <h3 className="font-semibold">{show.title}</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(show.date), "PPP")} at{" "}
                {format(new Date(show.date), "p")}
              </p>
              {isPastShow && (
                <p className="text-sm text-destructive mt-1">
                  This show has already passed
                </p>
              )}
              {hasReservation && (
                <p className="text-sm text-primary mt-1">
                  You have a reservation for this show
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => setLocation(`/show/${show.id}`)}
            disabled={isPastShow || hasReservation}
            variant={isPastShow || hasReservation ? "outline" : "default"}
            className="w-full sm:w-auto"
          >
            {isPastShow ? "Past Show" : hasReservation ? "Reserved" : "Reserve"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const { data: shows = [], isLoading: showsLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations/user"],
  });

  if (showsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0">Auditorium</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user?.isAdmin && (
              <Button variant="outline" onClick={() => setLocation("/admin")}>
                Admin Panel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 sm:px-8 space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Shows</CardTitle>
              <CardDescription>
                Select a show to make a reservation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-y-auto pr-2">
                {shows.length === 0 ? (
                  <p className="text-muted-foreground">No shows available</p>
                ) : (
                  <div className="space-y-4">
                    {shows.map((show) => (
                      <ShowCard
                        key={show.id}
                        show={show}
                        reservations={reservations}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Reservations</CardTitle>
              <CardDescription>
                View and manage your reservations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                {reservations.length === 0 ? (
                  <p className="text-muted-foreground">No reservations yet</p>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((reservation) => (
                      <ReservationCard
                        key={reservation.id}
                        reservation={reservation}
                        show={shows.find((s) => s.id === reservation.showId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ReservationCard({
  reservation,
  show,
}: {
  reservation: Reservation;
  show?: Show;
}) {
  const { toast } = useToast();
  const isPastShow = show && new Date(show.date) < new Date();
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to cancel reservation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/user"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/reservations/show/${reservation.showId}`],
      });
      toast({
        title: "Success",
        description: "Reservation cancelled successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!show) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h3 className="font-semibold">{show.title}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(show.date), "PPP")} at{" "}
              {format(new Date(show.date), "p")}
            </p>
            <p className="text-sm text-muted-foreground">
              Seats: {JSON.parse(reservation.seatNumbers).join(", ")}
            </p>
            {isPastShow && (
              <p className="text-sm text-destructive mt-1">
                This show has passed - cancellation disabled
              </p>
            )}
          </div>
          <Button
            variant="destructive"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending || isPastShow}
            className="w-full sm:w-auto"
          >
            {cancelMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}