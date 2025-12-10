import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Show, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2 } from "lucide-react";

export function ShowDetailsDialog({ show, onClose }: { show: Show; onClose: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const { data: reservations = [] } = useQuery<any[]>({ queryKey: ["/api/reservations"], staleTime: 0 });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"], staleTime: 0 });

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const showReservations = reservations.filter((r) => r.showId === show.id);
  const bookedSeats = showReservations.flatMap((r) => {
    try {
      return typeof r.seatNumbers === "string" ? JSON.parse(r.seatNumbers) : r.seatNumbers;
    } catch (e) {
      return [];
    }
  });

  const blockedSeats = Array.isArray(show.blockedSeats)
    ? show.blockedSeats
    : typeof show.blockedSeats === "string"
    ? show.blockedSeats.includes(",")
      ? show.blockedSeats.split(",").map((s) => s.trim())
      : show.blockedSeats
      ? [show.blockedSeats]
      : []
    : [];

  const allowedCategories = Array.isArray(show.allowedCategories)
    ? show.allowedCategories
    : typeof show.allowedCategories === "string"
    ? show.allowedCategories.includes("[")
      ? JSON.parse(show.allowedCategories)
      : show.allowedCategories.split(",").map((s) => s.trim())
    : [];

  const fafaExclusiveRows = Array.isArray(show.fafaExclusiveRows)
    ? show.fafaExclusiveRows
    : typeof show.fafaExclusiveRows === "string"
    ? show.fafaExclusiveRows.includes("[")
      ? JSON.parse(show.fafaExclusiveRows)
      : show.fafaExclusiveRows.split(",").map((s) => s.trim())
    : [];

  const layout = typeof show.seatLayout === "string" ? JSON.parse(show.seatLayout) : show.seatLayout;
  const totalSeats = layout.reduce((total: number, section: any) => {
    return total + section.rows.reduce((sectionTotal: number, row: any) => {
      return sectionTotal + row.seats.length;
    }, 0);
  }, 0);

  const availableSeats = totalSeats - bookedSeats.length - blockedSeats.length;

  const handleShare = () => {
    const showUrl = `${window.location.origin}/?show=${show.id}`;
    navigator.clipboard
      .writeText(showUrl)
      .then(() => {
        toast({ title: "Link Copied", description: "Show booking link copied to clipboard" });
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
      });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{show.emoji}</span>
            {show.title}
          </DialogTitle>
          <DialogDescription>Complete show details and booking information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-lg">{show.emoji}</span>
                  Show Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Title:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{show.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Date:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(show.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Available Seats:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{availableSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Allowed Categories:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{allowedCategories.join(", ")}</span>
                  </div>
                  {fafaExclusiveRows.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">FAFA Rows:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{fafaExclusiveRows.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Performance Metrics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Occupancy Rate:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{totalSeats > 0 ? Math.round((bookedSeats.length / totalSeats) * 100) : 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Total Reservations:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{showReservations.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Estimated Revenue:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">₹{(bookedSeats.length * (show.price || 0)).toLocaleString()}</span>
                  </div>
                  {totalSeats > 0 && (
                    <div className="pt-2 border-t dark:border-gray-600">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.round((bookedSeats.length / totalSeats) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{Math.round((bookedSeats.length / totalSeats) * 100)}% capacity filled</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {show.poster && (
                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Poster</h3>
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg border dark:border-gray-600">
                    <img src={show.poster} alt={`Poster for ${show.title}`} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {show.foodMenu && (
                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Food Menu</h3>
                  <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg border dark:border-gray-600">
                    <img src={show.foodMenu} alt="Food menu" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {!show.poster && !show.foodMenu && (
                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Media</h3>
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">{show.emoji || "🎬"}</div>
                    <p className="text-sm">No poster or menu uploaded</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share Booking Link
          </Button>
          <Button onClick={handleClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
