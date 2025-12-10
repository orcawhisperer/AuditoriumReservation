import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { insertReservationSchema, Reservation as DBReservation, Show, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { SeatGrid } from "@/components/seat-grid-new";

interface Reservation { id: number; showId: number; userId: number; seatNumbers: string; }

export function EditReservationDialog({ reservation, onClose, shows }: { reservation: Reservation; onClose: () => void; shows: Show[]; }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(
    typeof reservation.seatNumbers === 'string'
      ? (reservation.seatNumbers.startsWith('[') ? JSON.parse(reservation.seatNumbers) : reservation.seatNumbers.split(',').map(s => s.trim()))
      : Array.isArray(reservation.seatNumbers)
          ? reservation.seatNumbers
          : [],
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: showReservations = [] } = useQuery<Reservation[]>({ queryKey: [`/api/reservations/show/${reservation.showId}`], staleTime: 0 });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });

  const reservationUser = users.find((u) => u.id === reservation.userId);
  const userSeatLimit = reservationUser?.seatLimit || 4;

  const currentShow = shows.find((s) => s.id === reservation.showId);

  const form = useForm({
    resolver: zodResolver(insertReservationSchema),
    defaultValues: {
      showId: reservation.showId,
      seatNumbers: typeof reservation.seatNumbers === 'string'
        ? (reservation.seatNumbers.startsWith('[') ? JSON.parse(reservation.seatNumbers) : reservation.seatNumbers.split(',').map(s => s.trim()))
        : Array.isArray(reservation.seatNumbers)
            ? reservation.seatNumbers
            : [],
    },
  });

  const { user: currentAdmin } = useAuth();

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((current) => {
      if (current.includes(seatId)) return current.filter((id) => id !== seatId);
      if (!currentAdmin?.isAdmin) {
        if (current.length >= userSeatLimit) {
          toast({ title: "Maximum seats reached", description: `You can only reserve up to ${userSeatLimit} seats for this user`, variant: "destructive" });
          return current;
        }
      }
      return [...current, seatId].sort();
    });
  };

  const editReservationMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, seatNumbers: selectedSeats };
      const res = await fetch(`/api/reservations/${reservation.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      queryClient.invalidateQueries({ queryKey: [`/api/reservations/show/${reservation.showId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/user"] });
      setOpen(false);
      onClose();
      toast({ title: "Success", description: "Reservation updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update reservation", description: error.message, variant: "destructive" });
    },
  });

  if (!currentShow) return null;

  return (
    <Dialog open={open} onOpenChange={() => { setOpen(false); onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Reservation</DialogTitle>
          <DialogDescription>Update seats for this reservation.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm">Show: <span className="font-medium">{currentShow.title}</span> — {new Date(currentShow.date).toLocaleString()}</div>

          <SeatGrid showId={String(currentShow.id)} selectedSeats={selectedSeats} onSeatSelect={handleSeatSelect} isAdminMode hideActionButtons />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setShowConfirm(true)} disabled={editReservationMutation.isPending}>
              {editReservationMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Update Reservation
            </Button>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this reservation? The following seats will be assigned:
              <br />
              <span className="font-medium">{selectedSeats.join(", ")}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { editReservationMutation.mutate({ showId: currentShow.id, seatNumbers: selectedSeats }); setShowConfirm(false); }}>
              {editReservationMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
