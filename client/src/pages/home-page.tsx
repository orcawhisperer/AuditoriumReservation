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
import { 
  Loader2, 
  ChevronDown, 
  Share2, 
  Eye, 
  Trash2, 
  Copy, 
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  Film,
  Star,
  ChevronRight,
  MoreHorizontal,
  User,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  const userReservation = reservations.find((r) => r.showId === show.id);

  const seatCount = userReservation ? (() => {
    try {
      if (typeof userReservation.seatNumbers === 'string') {
        const parsed = userReservation.seatNumbers.startsWith('[')
          ? JSON.parse(userReservation.seatNumbers)
          : [userReservation.seatNumbers];
        return Array.isArray(parsed) ? parsed.length : 1;
      } else if (Array.isArray(userReservation.seatNumbers)) {
        return (userReservation.seatNumbers as string[]).length;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  })() : 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary/50">
      <CardContent className="p-0">
        <div className="flex">
          {/* Poster/Visual */}
          <div className="relative flex-shrink-0">
            {show.poster ? (
              <div className="w-24 h-32 rounded-l-lg overflow-hidden">
                <img
                  src={show.poster}
                  alt={`Poster for ${show.title}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="w-24 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-l-lg flex items-center justify-center">
                <div className="text-4xl">{show.emoji || "🎬"}</div>
              </div>
            )}
            {hasReservation && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                <Ticket className="h-3 w-3" />
              </div>
            )}
            {isPastShow && (
              <div className="absolute inset-0 bg-black/60 rounded-l-lg flex items-center justify-center">
                <Badge variant="secondary" className="text-xs">Past</Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                    {show.title}
                  </h3>
                  {show.emoji && (
                    <span className="text-lg flex-shrink-0">{show.emoji}</span>
                  )}
                </div>
                
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(show.date), "MMM dd, yyyy")}</span>
                    <Clock className="h-3 w-3 ml-2" />
                    <span>{format(new Date(show.date), "h:mm a")}</span>
                  </div>
                  
                  {hasReservation && userReservation && (
                    <div className="flex items-center gap-2 text-primary">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium">
                        {seatCount} seat{seatCount !== 1 ? 's' : ''} booked
                      </span>
                    </div>
                  )}
                </div>

                {show.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {show.description}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0 ml-4">
                <Button
                  onClick={() => setLocation(`/show/${show.id}`)}
                  disabled={isPastShow}
                  variant={
                    isPastShow ? "outline" : hasReservation ? "secondary" : "default"
                  }
                  size="sm"
                  className="group/btn"
                >
                  {isPastShow ? (
                    "Past Show"
                  ) : hasReservation ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      View Show
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4 mr-2" />
                      Book Now
                      <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [showsPage, setShowsPage] = useState(1);
  const [reservationsPage, setReservationsPage] = useState(1);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const showsPerPage = 6;
  const reservationsPerPage = 5;
  
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

  // Filter and paginate upcoming shows
  const upcomingShows = useMemo(() => {
    return shows
      .filter((show) => new Date(show.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [shows]);

  const paginatedShows = useMemo(() => {
    const startIndex = (showsPage - 1) * showsPerPage;
    return upcomingShows.slice(startIndex, startIndex + showsPerPage);
  }, [upcomingShows, showsPage, showsPerPage]);

  const showsTotalPages = Math.ceil(upcomingShows.length / showsPerPage);

  // Sort and paginate reservations (latest first)
  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => {
      // Sort by creation date (newest first), fallback to ID for consistent ordering
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // Newest first
      }
      return b.id - a.id; // Higher ID first as fallback
    });
  }, [reservations]);

  const paginatedReservations = useMemo(() => {
    const startIndex = (reservationsPage - 1) * reservationsPerPage;
    return sortedReservations.slice(startIndex, startIndex + reservationsPerPage);
  }, [sortedReservations, reservationsPage, reservationsPerPage]);

  const reservationsTotalPages = Math.ceil(sortedReservations.length / reservationsPerPage);

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

      <main className="container mx-auto py-8 px-4 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Upcoming Shows Section */}
          <div className="lg:col-span-3">
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {t("translation.home.upcomingShows")}
                    </CardTitle>
                    <CardDescription>
                      {upcomingShows.length} upcoming {upcomingShows.length === 1 ? 'show' : 'shows'} available
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingShows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 bg-muted/20 rounded-full mb-4">
                      <Film className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-lg mb-2">No upcoming shows</h3>
                    <p className="text-muted-foreground max-w-sm">
                      There are no scheduled shows at the moment. Check back later for new screenings.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {paginatedShows.map((show) => (
                        <ShowCard
                          key={show.id}
                          show={show}
                          reservations={reservations}
                        />
                      ))}
                    </div>
                    
                    {showsTotalPages > 1 && (
                      <div className="flex justify-center pt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => setShowsPage((p) => Math.max(1, p - 1))}
                                disabled={showsPage === 1}
                                className="cursor-pointer"
                              />
                            </PaginationItem>
                            {Array.from({ length: showsTotalPages }, (_, i) => i + 1).map(
                              (pageNum) => (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    onClick={() => setShowsPage(pageNum)}
                                    isActive={showsPage === pageNum}
                                    className="cursor-pointer"
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              ),
                            )}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() => setShowsPage((p) => Math.min(showsTotalPages, p + 1))}
                                disabled={showsPage === showsTotalPages}
                                className="cursor-pointer"
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Your Reservations Section */}
          <div className="lg:col-span-2">
            <Card className="sticky top-8">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">
                      {t("translation.home.yourReservations")}
                    </CardTitle>
                    <CardDescription>
                      {sortedReservations.length} active {sortedReservations.length === 1 ? 'booking' : 'bookings'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-h-[600px] overflow-y-auto pr-2 space-y-3">
                  {sortedReservations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="p-4 bg-muted/20 rounded-full mb-4">
                        <Ticket className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-lg mb-2">No reservations yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Book your first show to see your reservations here.
                      </p>
                      {upcomingShows.length > 0 && (
                        <Button
                          onClick={() => setLocation(`/show/${upcomingShows[0].id}`)}
                          size="sm"
                        >
                          Book Now
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {paginatedReservations.map((reservation) => (
                        <ReservationCard
                          key={reservation.id}
                          reservation={reservation}
                          show={shows.find((s) => s.id === reservation.showId)}
                        />
                      ))}
                      
                      {reservationsTotalPages > 1 && (
                        <div className="flex justify-center pt-4">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() => setReservationsPage((p) => Math.max(1, p - 1))}
                                  disabled={reservationsPage === 1}
                                  className="cursor-pointer"
                                />
                              </PaginationItem>
                              {Array.from({ length: reservationsTotalPages }, (_, i) => i + 1).map(
                                (pageNum) => (
                                  <PaginationItem key={pageNum}>
                                    <PaginationLink
                                      onClick={() => setReservationsPage(pageNum)}
                                      isActive={reservationsPage === pageNum}
                                      className="cursor-pointer"
                                    >
                                      {pageNum}
                                    </PaginationLink>
                                  </PaginationItem>
                                ),
                              )}
                              <PaginationItem>
                                <PaginationNext
                                  onClick={() => setReservationsPage((p) => Math.min(reservationsTotalPages, p + 1))}
                                  disabled={reservationsPage === reservationsTotalPages}
                                  className="cursor-pointer"
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
  const { user } = useAuth();
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
    
    const bookingDetails = `🎬 ${show.title}
📅 ${format(new Date(show.date), "EEEE, MMMM dd, yyyy")}
⏰ ${format(new Date(show.date), "h:mm a")}
🎫 Seats: ${seatNumbers.join(", ")}
🆔 Booking ID: #${reservation.id}
📍 BaazCine

Your cinema reservation is confirmed!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cinema Booking - ${show.title}`,
          text: bookingDetails,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(bookingDetails);
        toast({
          title: "Copied to clipboard",
          description: "Booking details copied successfully",
        });
      } catch (err) {
        console.error("Failed to copy:", err);
        toast({
          title: "Copy failed",
          description: "Unable to copy booking details",
          variant: "destructive",
        });
      }
    }
  };

  if (!show) return null;

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-0">
        <div className="flex">
          {/* Show Visual/Poster */}
          <div className="relative flex-shrink-0">
            {show.poster ? (
              <div className="w-16 h-20 rounded-l-lg overflow-hidden">
                <img
                  src={show.poster}
                  alt={show.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-l-lg flex items-center justify-center">
                <span className="text-2xl">{show.emoji || "🎬"}</span>
              </div>
            )}
            {isPastShow && (
              <div className="absolute inset-0 bg-black/60 rounded-l-lg flex items-center justify-center">
                <Badge variant="secondary" className="text-xs">Past</Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {show.title}
                </h4>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(show.date), "MMM dd")}</span>
                    <Clock className="h-3 w-3 ml-1" />
                    <span>{format(new Date(show.date), "h:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <MapPin className="h-3 w-3" />
                    <span className="font-medium">
                      {seatNumbers.length} seat{seatNumbers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="truncate">Seats: {seatNumbers.join(", ")}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 ml-2 flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={handleViewDetails}
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={handleShare}
                  title="Share Booking"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" 
                      disabled={isPastShow}
                      title="Cancel Booking"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              </div>
            </div>
          </div>
        </div>
        
        {/* Ticket Details Dialog */}
        <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Booking Details
              </DialogTitle>
              <DialogDescription>
                Complete information for your cinema reservation
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Show Information Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    {show?.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {show?.poster && (
                      <div className="w-20 h-28 rounded-lg overflow-hidden border flex-shrink-0">
                        <img
                          src={show.poster}
                          alt={show.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Date:</span>
                          <p className="font-medium">{show && format(new Date(show.date), "EEEE, MMM dd, yyyy")}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time:</span>
                          <p className="font-medium">{show && format(new Date(show.date), "h:mm a")}</p>
                        </div>
                      </div>
                      
                      {show?.description && (
                        <div>
                          <span className="text-muted-foreground text-sm">Description:</span>
                          <p className="text-sm mt-1">{show.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Information */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Seat Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Seat Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="text-muted-foreground text-sm">Seats:</span>
                        <p className="font-medium">{seatNumbers.join(", ")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Total Tickets:</span>
                        <p className="font-medium">{seatNumbers.length} {seatNumbers.length === 1 ? 'ticket' : 'tickets'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* User & Booking Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Booking Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="text-muted-foreground text-sm">Booked by:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <UserAvatar user={user} className="h-6 w-6" />
                          <span className="font-medium">{user?.username}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Booking ID:</span>
                        <p className="font-mono font-medium">#{reservation.id}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-sm">Booked on:</span>
                        <p className="font-medium">{format(new Date(reservation.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Food Menu */}
              {show?.foodMenu && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Food Menu Available
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden mb-3">
                      <img
                        src={show.foodMenu}
                        alt="Food Menu"
                        className="w-full h-auto max-h-64 object-contain bg-muted/10"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Food and beverages available at the concession stand
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Instructions */}
              <Card className="border-dashed border-2">
                <CardContent className="pt-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Important Information</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Present this booking confirmation at the cinema entrance</p>
                    <p>• Please arrive 15 minutes before the show time</p>
                    <p>• This is an internal cinema system</p>
                    <p>• Mobile phones should be silenced during the show</p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleShare} 
                  variant="outline" 
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Details
                </Button>
                <Button 
                  onClick={() => setLocation(`/show/${show?.id}`)}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Show
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
