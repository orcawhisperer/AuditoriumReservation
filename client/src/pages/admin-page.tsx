import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Show, insertShowSchema, User } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Loader2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";


interface Reservation {
  id: number;
  showId: number;
  userId: number;
  seatNumbers: string;
}

function ShowList() {
  const { toast } = useToast();
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const { data: shows = [], isLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
    staleTime: 0,
  });
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
    staleTime: 0,
  });

  const deleteShowMutation = useMutation({
    mutationFn: async (showId: number) => {
      const res = await fetch(`/api/shows/${showId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete show");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      toast({
        title: "Success",
        description: "Show deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete show",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getShowReservations = (showId: number) => {
    return reservations.filter((r) => r.showId === showId);
  };

  const getBookedSeats = (showId: number) => {
    const showReservations = getShowReservations(showId);
    return showReservations.flatMap((r) => JSON.parse(r.seatNumbers));
  };

  const calculateTotalSeats = (show: Show) => {
    const layout = JSON.parse(show.seatLayout);
    return layout.reduce((total: number, section: any) => {
      return (
        total +
        section.rows.reduce((sectionTotal: number, row: any) => {
          return sectionTotal + row.seats.length;
        }, 0)
      );
    }, 0);
  };

  if (isLoading || reservationsLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <CalendarPlus className="h-8 w-8 mb-2" />
        <p>No shows scheduled</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shows.map((show) => {
        const bookedSeats = getBookedSeats(show.id);
        const blockedSeats = JSON.parse(show.blockedSeats || "[]");
        const totalSeats = calculateTotalSeats(show);
        const availableSeats = totalSeats - bookedSeats.length - blockedSeats.length;

        return (
          <div
            key={show.id}
            className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-accent/50 transition-colors"
            style={{
              borderColor: show.themeColor || "#4B5320",
              backgroundColor: `${show.themeColor}10` || "#4B532010",
            }}
          >
            <div className="flex gap-4">
              {show.poster && (
                <div className="relative w-16 sm:w-24 overflow-hidden rounded-lg border">
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
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {show.emoji} {show.title}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(show.date), "PPP p")}
                </p>
                {show.description && (
                  <p className="text-sm text-muted-foreground">
                    {show.description}
                  </p>
                )}
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                    {availableSeats} Available
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500">
                    {bookedSeats.length} Booked
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-500">
                    {blockedSeats.length} Blocked
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingShow(show)}
              >
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteShowMutation.isPending}
                  >
                    {deleteShowMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Show</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this show? This action cannot be undone.
                      {getShowReservations(show.id).length > 0 && (
                        <p className="mt-2 text-red-500">
                          Warning: This show has {getShowReservations(show.id).length} active reservations.
                        </p>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteShowMutation.mutate(show.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
      {editingShow && (
        <EditShowDialog
          show={editingShow}
          onClose={() => setEditingShow(null)}
        />
      )}
    </div>
  );
}

export {ShowList}