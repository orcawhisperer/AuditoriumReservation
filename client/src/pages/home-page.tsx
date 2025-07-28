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
import { Loader2, ChevronDown, Share2, Eye, Trash2, Copy, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { DataPagination } from "@/components/data-pagination";
import React, { useState, useRef, useEffect, useCallback } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,  
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShowCardSkeleton,
  ReservationCardSkeleton,
} from "@/components/ui/skeleton-loaders";
import { UserAvatar } from "@/components/user-avatar";
import { Footer } from "@/components/footer";

function ShowCard({
  show,
  reservations,
}: {
  show: Show;
  reservations: Reservation[];
}) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const isPastShow = new Date(show.date) < new Date();
  const hasReservation = reservations.some((r) => r.showId === show.id);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {show.poster && (
              <div className="relative w-full sm:w-24 md:w-32 overflow-hidden rounded-lg border">
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
              <h3 className="font-semibold">{show.title}</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(show.date), "PPP")} at{" "}
                {format(new Date(show.date), "p")}
              </p>
              {isPastShow && (
                <p className="text-sm text-destructive mt-1">
                  {t("translation.admin.pastShowModificationsDisabled")}
                </p>
              )}
              {hasReservation && (
                <p className="text-sm text-primary mt-1">
                  {t("translation.home.viewReservation")}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => {
              if (hasReservation) {
                // If the user has a reservation, we should still go to the show page
                // but the page will show their reservation details instead of the reservation form
                setLocation(`/show/${show.id}`);
              } else {
                // Normal reservation flow
                setLocation(`/show/${show.id}`);
              }
            }}
            disabled={isPastShow}
            variant={
              isPastShow ? "outline" : hasReservation ? "secondary" : "default"
            }
            className="w-full sm:w-auto"
          >
            {
              isPastShow
                ? t("translation.show.soldOut")
                : hasReservation
                  ? t("translation.home.viewReservation")
                  : t(
                      "translation.home.bookTickets",
                    ) /* Already updated in i18n */
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [paginatedShows, setPaginatedShows] = useState<Show[]>([]);
  const [paginatedReservations, setPaginatedReservations] = useState<
    Reservation[]
  >([]);
  
  // Use useCallback to stabilize the pagination callback functions
  const handleShowsPagination = useCallback((shows: Show[]) => {
    setPaginatedShows(shows);
  }, []);
  
  const handleReservationsPagination = useCallback((reservations: Reservation[]) => {
    setPaginatedReservations(reservations);
  }, []);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { data: shows = [], isLoading: showsLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations/user"],
  });

  if (showsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
            <h1 className="text-2xl font-bold mb-4 sm:mb-0">
              {t("translation.common.appName")}
            </h1>
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </header>

        <main className="container mx-auto py-8 px-4 sm:px-8 space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("translation.home.upcomingShows")}</CardTitle>
                <CardDescription>
                  {t("translation.show.selectSeats")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] overflow-y-auto pr-2">
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <ShowCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("translation.home.yourReservations")}</CardTitle>
                <CardDescription>
                  {t("translation.home.viewReservation")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] overflow-y-auto pr-2">
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <ReservationCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b bg-background dark:bg-gray-800">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
          <h1 className="text-2xl font-bold mb-4 sm:mb-0">
            {t("translation.common.appName")}
          </h1>
          <div className="flex items-center gap-4">
            {user?.isAdmin && (
              <Button variant="outline" onClick={() => setLocation("/admin")}>
                {t("translation.admin.dashboard")}
              </Button>
            )}

            <div className="relative" ref={userMenuRef}>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <UserAvatar user={user} className="h-6 w-6" />
                <span className="ml-1">{user?.username}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover border border-border z-50">
                  <div className="py-1 rounded-md">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setLocation("/profile");
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent"
                    >
                      {t("translation.common.profile")}
                    </button>
                    <div className="h-px my-1 bg-muted" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        logoutMutation.mutate();
                      }}
                      className="flex w-full items-center px-4 py-2 text-sm hover:bg-accent"
                    >
                      {t("translation.common.logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 sm:px-8 space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("translation.home.upcomingShows")}</CardTitle>
              <CardDescription>
                {t("translation.show.selectSeats")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-y-auto pr-2">
                {shows.filter((show) => new Date(show.date) >= new Date())
                  .length === 0 ? (
                  <p className="text-muted-foreground">
                    {t("translation.home.noShows")}
                  </p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedShows.map((show) => (
                        <ShowCard
                          key={show.id}
                          show={show}
                          reservations={reservations}
                        />
                      ))}
                    </div>
                    <DataPagination
                      data={shows.filter(
                        (show) => new Date(show.date) >= new Date(),
                      )}
                      itemsPerPage={4}
                      onPageChange={handleShowsPagination}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("translation.home.yourReservations")}</CardTitle>
              <CardDescription>
                {t("translation.home.viewReservation")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                {reservations.length === 0 ? (
                  <p className="text-muted-foreground">
                    {t("translation.home.noReservations")}
                  </p>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedReservations.map((reservation) => (
                        <ReservationCard
                          key={reservation.id}
                          reservation={reservation}
                          show={shows.find((s) => s.id === reservation.showId)}
                        />
                      ))}
                    </div>
                    <DataPagination
                      data={reservations}
                      itemsPerPage={4}
                      onPageChange={handleReservationsPagination}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

interface ReservationCardProps {
  reservation: Reservation & { 
    seatNumbers: string | string[] 
  };
  show?: Show;
}

function ReservationCard({
  reservation,
  show,
}: ReservationCardProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const isPastShow = show && new Date(show.date) < new Date();
  
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to cancel reservation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/user"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/reservations/show/${reservation.showId}`],
      });
      toast({
        title: t("translation.common.success"),
        description: t("translation.home.cancelReservation"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("translation.common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const seatNumbers = (() => {
    try {
      if (typeof reservation.seatNumbers === "string") {
        return reservation.seatNumbers.startsWith("[")
          ? JSON.parse(reservation.seatNumbers)
          : [reservation.seatNumbers];
      } else if (Array.isArray(reservation.seatNumbers)) {
        return reservation.seatNumbers as string[];
      }
      return [];
    } catch (e) {
      console.error("Error parsing seat numbers:", e);
      return [];
    }
  })();

  const handleViewDetails = () => {
    setTicketDialogOpen(true);
  };

  const handleShare = async () => {
    if (!show) return;
    
    const shareText = `${t("translation.home.shareText")} ${show.title} - ${format(new Date(show.date), "PPP")} ${t("translation.common.seats")}: ${seatNumbers.join(", ")}`;
    const shareUrl = `${window.location.origin}/show/${show.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t("translation.common.appName")} - ${show.title}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        toast({
          title: t("translation.common.success"),
          description: "Reservation details copied to clipboard",
        });
      } catch (err) {
        console.error("Failed to copy:", err);
        toast({
          title: t("translation.common.error"),
          description: "Failed to copy reservation details",
          variant: "destructive",
        });
      }
    }
  };

  if (!show) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{show.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(show.date), "PPP")} at{" "}
                  {format(new Date(show.date), "p")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("translation.common.seats")}: {seatNumbers.join(", ")}
                </p>

                {isPastShow && (
                  <p className="text-sm text-destructive mt-1">
                    {t("translation.admin.pastShowModificationsDisabled")}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Reservation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      disabled={isPastShow}
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("translation.home.cancelReservationTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("translation.home.cancelReservationConfirmation", {
                          showTitle: show.title,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("translation.common.back")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelMutation.mutate()}
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        )}
                        {t("translation.common.confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Ticket Dialog */}
        <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Your Cinema Ticket
              </DialogTitle>
              <DialogDescription>
                Complete booking details for {show?.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Show Details */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
                <div className="flex flex-col sm:flex-row gap-4">
                  {show?.poster && (
                    <div className="w-full sm:w-32 h-48 sm:h-32 rounded-lg overflow-hidden border">
                      <img
                        src={show.poster}
                        alt={show.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{show?.title}</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Date & Time:</strong> {show && format(new Date(show.date), "PPP 'at' p")}</p>
                      <p><strong>Seats:</strong> {seatNumbers.join(", ")}</p>
                      <p><strong>Quantity:</strong> {seatNumbers.length} {seatNumbers.length === 1 ? 'ticket' : 'tickets'}</p>

                      <p><strong>Booking ID:</strong> #{reservation.id}</p>
                      <p><strong>Booked On:</strong> {format(new Date(reservation.createdAt), "PPP 'at' p")}</p>
                    </div>
                  </div>
                </div>
                
                {show?.description && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">{show.description}</p>
                  </div>
                )}
              </div>
              
              {/* Food Menu */}
              {show?.foodMenu && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Food Menu Available</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={show.foodMenu}
                      alt="Food Menu"
                      className="w-full h-auto max-h-96 object-contain bg-gray-50"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Food and beverages are available at the cinema. Please visit the concession stand.
                  </p>
                </div>
              )}
              
              {/* Seat Map Visual */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Your Seat Location</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center mb-4">
                    <div className="inline-block bg-gray-300 px-6 py-2 rounded-t-lg text-sm font-medium">
                      SCREEN
                    </div>
                  </div>
                  <div className="grid grid-cols-8 gap-1 max-w-md mx-auto">
                    {seatNumbers.map((seat: string, index: number) => (
                      <div key={index} className="bg-primary text-primary-foreground text-xs p-2 rounded text-center font-medium">
                        {seat}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    Your reserved seats are highlighted above
                  </p>
                </div>
              </div>
              
              {/* Important Notes */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Important Information</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Please arrive 15 minutes before the show time</li>
                  <li>• Present this booking confirmation at the entrance</li>
                  <li>• This is an internal cinema system - no payment required</li>
                  <li>• Mobile phones should be silenced during the show</li>
                  {show?.foodMenu && (
                    <li>• Food and beverages are available at the concession stand</li>
                  )}
                </ul>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Booking
                </Button>
                {!isPastShow && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel Booking
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Reservation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel your booking for {show?.title}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            cancelMutation.mutate();
                            setTicketDialogOpen(false);
                          }}
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Cancel Booking
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
