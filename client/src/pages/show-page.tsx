import { SeatGrid } from "@/components/seat-grid";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { Shield } from "lucide-react";
import { Show } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function ShowPage() {
  const [, setLocation] = useLocation();
  const { showId } = useParams<{ showId: string }>();

  console.log("TEST",showId)

  const { data: show, isLoading } = useQuery<Show>({
    queryKey: [`/api/shows/${showId}`],
  });

  if (!show && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4B5320]/10 to-[#4B5320]/5">
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Seat Reservation</h1>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Back to Shows
            </Button>
          </div>
        </header>
        <main className="container mx-auto py-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-muted-foreground">Show not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B5320]/10 to-[#4B5320]/5">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Seat Reservation</h1>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Shows
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <div className="max-w-5xl mx-auto">
          <SeatGrid />
        </div>
      </main>
    </div>
  );
}