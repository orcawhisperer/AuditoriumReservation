import React, { useState } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Reservation, Show, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Eye, Trash2 } from "lucide-react";
import { DataTable } from "./DataTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface ReservationWithDetails extends Reservation {
  show?: Show;
  user?: User;
  
  // Ensure compatibility with the schema type
  seatNumber: string; // This field exists in the Reservation type from the schema
}

function ReservationDetailsDialog({ 
  reservation, 
  open, 
  onClose 
}: { 
  reservation: ReservationWithDetails; 
  open: boolean; 
  onClose: () => void 
}) {
  const { t } = useTranslation();
  
  if (!reservation.show) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            {t('translation.admin.reservationDetails')}
          </DialogTitle>
          <DialogDescription>
            {t('translation.admin.reservationDetailsDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="text-sm font-medium">{t('translation.common.show')}</div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{reservation.show.emoji || "🎭"}</span>
                <span className="font-medium">{reservation.show.title}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(reservation.show.date), "PPP p")}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">{t('translation.common.user')}</div>
              <div className="font-medium">
                {reservation.user?.username || t('translation.common.unknown')}
              </div>
              <div className="text-sm">
                {t('translation.admin.seatNumber')}: 
                <span className="font-semibold ml-1">{reservation.seatNumber}</span>
              </div>
            </div>
          </div>
          
          <div className="rounded-md border p-4">
            <h3 className="font-medium mb-2">{t('translation.admin.seatLayout')}</h3>
            <SeatGrid
              showId={reservation.showId.toString()}
              selectedSeats={[reservation.seatNumber]}
              hideActionButtons={true}
              className="max-h-[300px] overflow-y-auto"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReservationManagement() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithDetails | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<ReservationWithDetails | null>(null);
  
  // Fetch all reservations
  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
  });
  
  // Fetch shows
  const { data: shows = [] } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });
  
  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Delete reservation
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
  
  // Enrich reservations with show and user details
  const reservationsWithDetails: ReservationWithDetails[] = reservations.map(reservation => {
    const show = shows.find(s => s.id === reservation.showId);
    const user = users.find(u => u.id === reservation.userId);
    return { ...reservation, show, user };
  });
  
  const columns = [
    {
      header: t('translation.common.show'),
      accessorKey: "showId",
      cell: (row: ReservationWithDetails) => {
        const show = row.show;
        return show ? (
          <div className="flex items-center gap-2">
            <span className="text-xl">{show.emoji || "🎭"}</span>
            <div>
              <div className="font-medium">{show.title}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(show.date), "PPP")}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">{t('translation.common.unknown')}</span>
        );
      },
    },
    {
      header: t('translation.common.user'),
      accessorKey: "userId",
      cell: (row: ReservationWithDetails) => {
        const user = row.user;
        return user ? (
          <div className="font-medium">{user.username}</div>
        ) : (
          <span className="text-muted-foreground">{t('translation.common.unknown')}</span>
        );
      },
    },
    {
      header: t('translation.admin.seat'),
      accessorKey: "seatNumber",
      cell: (row: ReservationWithDetails) => (
        <div className="font-mono bg-muted px-2 py-1 rounded inline-block">
          {row.seatNumber}
        </div>
      ),
    },
    {
      header: t('translation.admin.actions'),
      accessorKey: "actions",
      cell: (row: ReservationWithDetails) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedReservation(row)}
            title={t('translation.admin.viewDetails')}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setReservationToDelete(row)}
            title={t('translation.admin.deleteReservation')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          {t('translation.admin.manageReservations')}
        </CardTitle>
        <CardDescription>
          {t('translation.admin.manageReservationsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={reservationsWithDetails}
          columns={columns}
          searchable
        />
        
        {/* Reservation Details Dialog */}
        {selectedReservation && (
          <ReservationDetailsDialog
            reservation={selectedReservation}
            open={!!selectedReservation}
            onClose={() => setSelectedReservation(null)}
          />
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
                {reservationToDelete?.show && (
                  <>
                    <strong>{reservationToDelete.show.title}</strong>,
                    {t('translation.admin.seat')} <strong>{reservationToDelete.seatNumber}</strong>
                  </>
                )}
                ?
                {t('translation.admin.deleteReservationWarningDetail')}
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
      </CardContent>
    </Card>
  );
}