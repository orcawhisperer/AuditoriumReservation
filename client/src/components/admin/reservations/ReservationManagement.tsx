import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Show } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Loader2, Ticket, Edit } from "lucide-react";
import { ShowFilterSelect } from "./ShowFilterSelect";
import { UserFilterSelect } from "./UserFilterSelect";
import { EditReservationDialog } from "./EditReservationDialog";

interface Reservation { id: number; showId: number; userId: number; seatNumbers: string; }

export function ReservationManagement() {
  const { toast } = useToast();
  const [selectedShowId, setSelectedShowId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "user" | "show">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const { data: shows = [], isLoading: showsLoading } = useQuery<Show[]>({ queryKey: ["/api/shows"], staleTime: 1000 });
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({ queryKey: ["/api/reservations"], staleTime: 1000 });
  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({ queryKey: ["/api/users"], staleTime: 1000 });

  const deleteReservationMutation = useMutation({
    mutationFn: async (reservationId: number) => {
      const res = await fetch(`/api/reservations/${reservationId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete reservation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: "Success", description: "Reservation deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete reservation", description: error.message, variant: "destructive" });
    },
  });

  const getShowTitle = (showId: number) => shows.find((s) => s.id === showId)?.title || "Unknown Show";
  const getShowDate = (showId: number) => shows.find((s) => s.id === showId)?.date || new Date().toISOString();
  const getUserName = (userId: number) => users.find((u) => u.id === userId)?.name || users.find((u) => u.id === userId)?.username || "Unknown User";
  const isShowInPast = (showId: number) => {
    const show = shows.find((s) => s.id === showId);
    if (!show) return false;
    return new Date(show.date) < new Date();
  };

  const filteredAndSortedReservations = useMemo(() => {
    let filtered = reservations;
    if (selectedShowId !== "all") filtered = filtered.filter((r) => r.showId === parseInt(selectedShowId, 10));
    if (selectedUserId !== "all") filtered = filtered.filter((r) => r.userId === parseInt(selectedUserId, 10));
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const showTitle = getShowTitle(r.showId).toLowerCase();
        const userName = getUserName(r.userId).toLowerCase();
        const seatNumbers = (() => {
          try {
            if (typeof r.seatNumbers === 'string') {
              return r.seatNumbers.startsWith('[') ? JSON.parse(r.seatNumbers).join(" ").toLowerCase() : r.seatNumbers.toLowerCase();
            } else if (Array.isArray(r.seatNumbers)) {
              return r.seatNumbers.join(" ").toLowerCase();
            }
            return "";
          } catch (e) { return ""; }
        })();
        return showTitle.includes(query) || userName.includes(query) || seatNumbers.includes(query);
      });
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date") {
        const da = new Date(getShowDate(a.showId)).getTime();
        const db = new Date(getShowDate(b.showId)).getTime();
        return sortOrder === "asc" ? da - db : db - da;
      } else if (sortBy === "user") {
        return sortOrder === "asc" ? getUserName(a.userId).localeCompare(getUserName(b.userId)) : getUserName(b.userId).localeCompare(getUserName(a.userId));
      } else {
        return sortOrder === "asc" ? getShowTitle(a.showId).localeCompare(getShowTitle(b.showId)) : getShowTitle(b.showId).localeCompare(getShowTitle(a.showId));
      }
    });
    return sorted;
  }, [reservations, selectedShowId, selectedUserId, searchQuery, sortBy, sortOrder, shows, users]);

  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filteredAndSortedReservations.length / itemsPerPage);
  const paginated = filteredAndSortedReservations.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (showsLoading || reservationsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <ShowFilterSelect selectedShowId={selectedShowId} onSelectShow={setSelectedShowId} shows={shows} />
          <UserFilterSelect selectedUserId={selectedUserId} onSelectUser={setSelectedUserId} users={users} />
          <Input placeholder="Search reservations (user, show, or seats)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant={sortBy === 'date' ? 'default' : 'outline'} onClick={() => setSortBy('date')}>Sort by Date</Button>
          <Button size="sm" variant={sortBy === 'user' ? 'default' : 'outline'} onClick={() => setSortBy('user')}>Sort by User</Button>
          <Button size="sm" variant={sortBy === 'show' ? 'default' : 'outline'} onClick={() => setSortBy('show')}>Sort by Show</Button>
          <Button size="sm" variant="outline" onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}>{sortOrder === 'asc' ? 'Asc' : 'Desc'}</Button>
        </div>

        <div className="space-y-3">
          {paginated.length > 0 ? (
            paginated.map((r) => (
              <div key={r.id} className="p-4 border rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-medium">{getUserName(r.userId)} → {getShowTitle(r.showId)}</div>
                  <div className="text-sm text-muted-foreground">{new Date(getShowDate(r.showId)).toLocaleString()} • Seats: {(() => { try { return typeof r.seatNumbers === 'string' ? (r.seatNumbers.startsWith('[') ? JSON.parse(r.seatNumbers).join(', ') : r.seatNumbers) : Array.isArray(r.seatNumbers) ? r.seatNumbers.join(', ') : ''; } catch { return ''; } })()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingReservation(r)} className="flex items-center gap-1">
                    <Edit className="h-4 w-4" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" disabled className="opacity-50">Delete</Button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Ticket className="h-12 w-12 mb-4 text-gray-400 dark:text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No reservations found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{searchQuery ? `No reservations match "${searchQuery}"` : "No reservations have been made yet"}</p>
              {(selectedShowId !== "all" || selectedUserId !== "all" || searchQuery) && (
                <Button variant="outline" size="sm" onClick={() => { setSelectedShowId("all"); setSelectedUserId("all"); setSearchQuery(""); }} className="mt-3">Clear Filters</Button>
              )}
            </div>
          )}
        </div>

        {filteredAndSortedReservations.length > itemsPerPage && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="cursor-pointer" />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink onClick={() => setPage(pageNum)} isActive={page === pageNum} className="cursor-pointer">{pageNum}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="cursor-pointer" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {editingReservation && (
          <EditReservationDialog reservation={editingReservation} onClose={() => setEditingReservation(null)} shows={shows} />
        )}
      </CardContent>
    </Card>
  );
}
