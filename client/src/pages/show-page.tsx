import { SeatGrid } from "@/components/seat-grid";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { Shield, AlertTriangle } from "lucide-react";
import { Show } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ShowPage() {
  const [, setLocation] = useLocation();
  const { showId } = useParams<{ showId: string }>();

  const { data: show, isLoading } = useQuery<Show>({
    queryKey: [`/api/shows/${showId}`],
  });

  if (!show && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4B5320]/10 to-[#4B5320]/5">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Seat Reservation</h1>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Back to Shows
            </Button>
          </div>
        </header>
        <main className="container mx-auto py-8 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-muted-foreground">Show not found</p>
          </div>
        </main>
      </div>
    );
  }

  const isPastShow = show && new Date(show.date) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B5320]/10 to-[#4B5320]/5">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Seat Reservation</h1>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Shows
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          {isPastShow && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Past Show</AlertTitle>
              <AlertDescription>
                This show took place on {format(new Date(show.date), "PPP")} at {format(new Date(show.date), "p")}. 
                Reservations are no longer available.
              </AlertDescription>
            </Alert>
          )}

          {show && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{show.emoji}</span> {show.title}
                </CardTitle>
                <CardDescription>
                  {format(new Date(show.date), "PPP")} at {format(new Date(show.date), "p")}
                </CardDescription>
              </CardHeader>
              {show.description && (
                <CardContent>
                  <p>{show.description}</p>
                </CardContent>
              )}
            </Card>
          )}

          {isPastShow ? (
            <div className="text-center p-8 border rounded-lg bg-accent/20">
              <p className="text-muted-foreground">
                Reservations are not available for past shows.
              </p>
            </div>
          ) : (
            <SeatGrid />
          )}
        </div>
      </main>
    </div>
  );
}