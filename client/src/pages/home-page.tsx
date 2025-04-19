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
import { Loader2, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { DataPagination } from "@/components/data-pagination";
import React, { useState, useRef, useEffect } from "react";
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
    <div className="min-h-screen bg-background pb-32">
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
                      onPageChange={setPaginatedShows}
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
                      onPageChange={setPaginatedReservations}
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

  if (!show) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h3 className="font-semibold">{show.title}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(show.date), "PPP")} at{" "}
              {format(new Date(show.date), "p")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("translation.common.seats")}:{" "}
              {(() => {
                try {
                  if (typeof reservation.seatNumbers === "string") {
                    return reservation.seatNumbers.startsWith("[")
                      ? JSON.parse(reservation.seatNumbers).join(", ")
                      : reservation.seatNumbers;
                  } else if (Array.isArray(reservation.seatNumbers)) {
                    // Use type assertion to handle the never type error
                    return (reservation.seatNumbers as string[]).join(", ");
                  }
                  return "";
                } catch (e) {
                  console.error("Error parsing seat numbers:", e);
                  return "";
                }
              })()}
            </p>
            {isPastShow && (
              <p className="text-sm text-destructive mt-1">
                {t("translation.admin.pastShowModificationsDisabled")}
              </p>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={cancelMutation.isPending || isPastShow}
                className="w-full sm:w-auto"
              >
                {cancelMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {t("translation.common.cancel")}
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
      </CardContent>
    </Card>
  );
}
