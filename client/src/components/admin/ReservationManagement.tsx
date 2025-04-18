import React, { useState } from "react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { User, Show, Reservation, insertReservationSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "./DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SeatGrid } from "@/components/seat-grid-new";
import { Ticket, Trash2, Edit, Eye, UserCheck } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

interface ReservationWithUser extends Reservation {
  user?: User;
  show?: Show;
}

// Optimize with React.memo to prevent unnecessary re-renders
const ReservationList = React.memo(() => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [editingReservation, setEditingReservation] = useState<ReservationWithUser | null>(null);
  const [previewReservation, setPreviewReservation] = useState<ReservationWithUser | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<ReservationWithUser | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Use a single query to fetch all data together for optimized performance
  const { data: reservations = [], isLoading: isLoadingReservations } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: shows = [], isLoading: isLoadingShows } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  // Combine the data for easier display
  const combinedReservations: ReservationWithUser[] = reservations.map((reservation) => ({
    ...reservation,
    user: users.find((user) => user.id === reservation.userId),
    show: shows.find((show) => show.id === reservation.showId),
  }));

  const deleteReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setReservationToDelete(null);
      toast({
        title: "Success",
        description: "Reservation deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete reservation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, seats }: { id: number; seats: string[] }) => {
      const payload = {
        seatNumbers: seats,
      };

      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      queryClient.invalidateQueries({ 
        queryKey: editingReservation ? [`/api/reservations/show/${editingReservation.showId}`] : undefined 
      });
      setEditingReservation(null);
      setSelectedSeats([]);
      toast({
        title: "Success",
        description: "Reservation updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update reservation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditReservation = (reservation: ReservationWithUser) => {
    try {
      // Parse the seat numbers for initial selection
      const seats = typeof reservation.seatNumbers === "string"
        ? reservation.seatNumbers.startsWith("[")
          ? JSON.parse(reservation.seatNumbers)
          : reservation.seatNumbers.split(",").map((s) => s.trim())
        : Array.isArray(reservation.seatNumbers)
          ? reservation.seatNumbers
          : [];
      
      setSelectedSeats(seats);
      setEditingReservation(reservation);
    } catch (e) {
      console.error("Error parsing seat numbers:", e);
      toast({
        title: "Error",
        description: "Failed to parse seat numbers",
        variant: "destructive",
      });
    }
  };

  const handleSeatSelect = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      // Remove seat if already selected
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      // Add seat
      setSelectedSeats([...selectedSeats, seatId].sort());
    }
  };

  const formatSeats = (seatNumbers: string | string[]) => {
    try {
      const seats = typeof seatNumbers === "string"
        ? seatNumbers.startsWith("[")
          ? JSON.parse(seatNumbers)
          : seatNumbers.split(",").map((s) => s.trim())
        : Array.isArray(seatNumbers)
          ? seatNumbers
          : [];
      
      return seats.join(", ");
    } catch (e) {
      console.error("Error formatting seats:", e);
      return seatNumbers;
    }
  };

  const columns = [
    {
      header: t('translation.common.user'),
      accessorKey: (reservation: ReservationWithUser) => (
        <div className="flex items-center gap-2">
          <UserAvatar user={reservation.user} />
          <span>{reservation.user?.username}</span>
        </div>
      ),
    },
    {
      header: t('translation.common.show'),
      accessorKey: (reservation: ReservationWithUser) => (
        <div className="flex items-center gap-1">
          <span>{reservation.show?.emoji || "🎭"}</span>
          <span>{reservation.show?.title}</span>
        </div>
      ),
    },
    {
      header: t('translation.common.date'),
      accessorKey: (reservation: ReservationWithUser) => 
        reservation.show ? format(new Date(reservation.show.date), "PPP") : "-",
    },
    {
      header: t('translation.admin.seats'),
      accessorKey: (reservation: ReservationWithUser) => formatSeats(reservation.seatNumbers),
    },
    {
      header: t('translation.admin.actions'),
      accessorKey: (reservation: ReservationWithUser) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPreviewReservation(reservation)}
            title={t('translation.admin.preview')}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleEditReservation(reservation)}
            title={t('translation.common.edit')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setReservationToDelete(reservation)}
            title={t('translation.common.delete')}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const isLoading = isLoadingReservations || isLoadingUsers || isLoadingShows;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <DataTable
        data={combinedReservations}
        columns={columns}
        searchable
        searchKeys={["user?.username", "show?.title"]}
      />

      {/* Preview Dialog */}
      {previewReservation && previewReservation.show && (
        <Dialog 
          open={!!previewReservation} 
          onOpenChange={(isOpen) => !isOpen && setPreviewReservation(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {t('translation.admin.reservationDetails')}
              </DialogTitle>
              <DialogDescription>
                {previewReservation.show.emoji} {previewReservation.show.title} - 
                {format(new Date(previewReservation.show.date), "PPP p")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar user={previewReservation.user} />
                <div>
                  <div className="font-medium">{previewReservation.user?.username}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('translation.admin.seats')}: {formatSeats(previewReservation.seatNumbers)}
                  </div>
                </div>
              </div>
              <div className="p-2 rounded-md border">
                <SeatGrid
                  showId={previewReservation.showId.toString()}
                  hideActionButtons={true}
                  userReservation={previewReservation}
                  isAdminMode={true}
                  className="max-h-[400px] overflow-y-auto"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingReservation && editingReservation.show && (
        <Dialog 
          open={!!editingReservation} 
          onOpenChange={(isOpen) => !isOpen && setEditingReservation(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {t('translation.admin.editReservation')}
              </DialogTitle>
              <DialogDescription>
                {t('translation.admin.editReservationFor')} {editingReservation.user?.username}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">
                      {editingReservation.show.emoji} {editingReservation.show.title}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(editingReservation.show.date), "PPP p")}
                    </div>
                  </div>
                </div>
                <div className="text-sm bg-primary/10 text-primary-foreground px-2 py-1 rounded-md">
                  {selectedSeats.length} {t('translation.admin.seatsSelected')}
                </div>
              </div>
              <div className="rounded-md border">
                <SeatGrid
                  showId={editingReservation.showId.toString()}
                  selectedSeats={selectedSeats}
                  onSeatSelect={handleSeatSelect}
                  userReservation={editingReservation}
                  hideActionButtons={true}
                  isAdminMode={true}
                  className="max-h-[400px] overflow-y-auto"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingReservation(null)}
                >
                  {t('translation.common.cancel')}
                </Button>
                <Button
                  type="button"
                  disabled={updateReservationMutation.isPending}
                  onClick={() => 
                    updateReservationMutation.mutate({ 
                      id: editingReservation.id, 
                      seats: selectedSeats 
                    })
                  }
                >
                  {updateReservationMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {t('translation.common.updating')}
                    </div>
                  ) : (
                    t('translation.common.save')
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!reservationToDelete} 
        onOpenChange={(isOpen) => !isOpen && setReservationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('translation.admin.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('translation.admin.deleteReservationWarning')} 
              <strong>{reservationToDelete?.user?.username}</strong> 
              {t('translation.admin.forShow')} 
              <strong>{reservationToDelete?.show?.title}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('translation.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reservationToDelete && deleteReservationMutation.mutate(reservationToDelete.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteReservationMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('translation.common.deleting')}
                </div>
              ) : (
                t('translation.common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

// Main ReservationManagement component
export function ReservationManagement() {
  const { t } = useTranslation();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          {t('translation.admin.reservationManagement')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReservationList />
      </CardContent>
    </Card>
  );
}