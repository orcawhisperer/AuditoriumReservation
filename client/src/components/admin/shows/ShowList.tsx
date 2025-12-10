import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Show, User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Loader2, CalendarPlus, Edit, Share2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ShowDetailsDialog } from "./ShowDetailsDialog";
import { EditShowDialog } from "./EditShowDialog";

interface Reservation { id: number; showId: number; userId: number; seatNumbers: string; }

export function ShowList() {
  const { toast } = useToast();
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [viewingShow, setViewingShow] = useState<Show | null>(null);
  const { data: showsData = [], isLoading } = useQuery<Show[]>({ queryKey: ["/api/shows"], staleTime: 0 });

  // Sort shows by date (latest first)
  const shows = useMemo(() => {
    return [...showsData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [showsData]);

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({ queryKey: ["/api/reservations"], staleTime: 0 });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"], staleTime: 0 });

  const deleteShowMutation = useMutation({
    mutationFn: async (showId: number) => {
      const res = await fetch(`/api/shows/${showId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete show");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      toast({ title: "Success", description: "Show deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete show", description: error.message, variant: "destructive" });
    },
  });

  const getShowReservations = (showId: number) => reservations.filter((r) => r.showId === showId);
  const getBookedSeats = (showId: number) => {
    const showReservations = getShowReservations(showId);
    return showReservations.flatMap((r) => {
      try {
        return typeof r.seatNumbers === "string" ? JSON.parse(r.seatNumbers) : r.seatNumbers;
      } catch (e) {
        console.error("Error parsing seat numbers:", e);
        return [];
      }
    });
  };

  const calculateTotalSeats = (show: Show) => {
    const layout = typeof show.seatLayout === "string" ? JSON.parse(show.seatLayout) : show.seatLayout;
    return layout.reduce((total: number, section: any) => total + section.rows.reduce((sectionTotal: number, row: any) => sectionTotal + row.seats.length, 0), 0);
  };

  const getUserName = (userId: number) => users.find((u) => u.id === userId)?.name || users.find((u) => u.id === userId)?.username || "Unknown User";

  const itemsPerPage = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(shows.length / itemsPerPage);
  const paginatedShows = shows.slice((page - 1) * itemsPerPage, page * itemsPerPage);

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
      <div className="space-y-3">
        {paginatedShows.map((show) => {
          const showReservations = getShowReservations(show.id);
          const bookedSeats = getBookedSeats(show.id);
          const blockedSeats = Array.isArray(show.blockedSeats)
            ? show.blockedSeats
            : typeof show.blockedSeats === "string"
            ? show.blockedSeats.includes("[")
              ? JSON.parse(show.blockedSeats)
              : show.blockedSeats.split(",").map((s) => s.trim())
            : [];
          const totalSeats = calculateTotalSeats(show);

          return (
            <div key={show.id} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{show.emoji || "🎭"}</span>
                  <h4 className="font-semibold">{show.title}</h4>
                  <Badge variant="secondary" className="ml-2">{format(new Date(show.date), "PPp")}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="mr-2">Blocked: {blockedSeats.length}</span>
                  <span className="mr-2">Booked: {bookedSeats.length}</span>
                  <span>Total Seats: {totalSeats}</span>
                </div>
                <div className="text-sm">Estimated Revenue: ₹{(bookedSeats.length * (show.price || 0)).toLocaleString()}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewingShow(show)} className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden md:inline">View</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingShow(show)} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span className="hidden md:inline">Edit</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden md:inline">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Show?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the show and remove all associated data.
                        {showReservations.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 font-medium">⚠️ Warning: This show has {showReservations.length} active reservation{showReservations.length !== 1 ? 's' : ''}.</p>
                          </div>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteShowMutation.mutate(show.id)} className="bg-red-600 hover:bg-red-700">
                        Delete Show
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>

      {shows.length > itemsPerPage && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="cursor-pointer" />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink onClick={() => setPage(pageNum)} isActive={page === pageNum} className="cursor-pointer">
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="cursor-pointer" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {editingShow && <EditShowDialog show={editingShow} onClose={() => setEditingShow(null)} />}
      {viewingShow && <ShowDetailsDialog show={viewingShow} onClose={() => setViewingShow(null)} />}
    </div>
  );
}
