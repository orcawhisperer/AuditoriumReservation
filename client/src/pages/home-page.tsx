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
import { SeatGrid } from "@/components/seat-grid";
import { queryClient } from "@/lib/queryClient";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  const { data: shows, isLoading: showsLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  const { data: reservations } = useQuery<Reservation[]>({
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
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold">Auditorium</h1>
          <div className="flex items-center gap-4">
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

      <main className="container py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Shows</CardTitle>
              <CardDescription>
                Select a show to make a reservation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shows?.length === 0 ? (
                <p className="text-muted-foreground">No shows available</p>
              ) : (
                <div className="space-y-4">
                  {shows?.map((show) => (
                    <ShowCard key={show.id} show={show} />
                  ))}
                </div>
              )}
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
              {reservations?.length === 0 ? (
                <p className="text-muted-foreground">No reservations yet</p>
              ) : (
                <div className="space-y-4">
                  {reservations?.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      show={shows?.find((s) => s.id === reservation.showId)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ShowCard({ show }: { show: Show }) {
  const [, setLocation] = useLocation();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{show.title}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(show.date), "PPP")}
            </p>
            <p className="text-sm text-muted-foreground">
              Price: ${show.price}
            </p>
          </div>
          <Button onClick={() => setLocation(`/shows/${show.id}`)}>
            Reserve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReservationCard({ reservation, show }: { reservation: Reservation; show?: Show }) {
  const cancelMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/reservations/${reservation.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/user"] });
    },
  });

  if (!show) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{show.title}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(show.date), "PPP")}
            </p>
            <p className="text-sm text-muted-foreground">
              Seats: {reservation.seatNumbers.join(", ")}
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
