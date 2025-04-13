import { SeatGrid } from "@/components/seat-grid-new";
import { Button } from "@/components/ui/button";
import { useLocation, useParams } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { Shield, AlertTriangle } from "lucide-react";
import { Show } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { SeatGridSkeleton } from "@/components/ui/skeleton-loaders";
import { useTranslation } from "react-i18next";

export default function ShowPage() {
  const [, setLocation] = useLocation();
  const { showId } = useParams<{ showId: string }>();
  const { t } = useTranslation();

  const { data: show, isLoading } = useQuery<Show>({
    queryKey: [`/api/shows/${showId}`],
  });

  // Base layout for all states
  const Layout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-[#4B5320]/10 to-[#4B5320]/5">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{t("translation.show.showDetails")}</h1>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")}>
            {t("translation.admin.backToHome")}
          </Button>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
          
          <SeatGridSkeleton />
        </div>
      </Layout>
    );
  }

  if (!show) {
    return (
      <Layout>
        <div className="text-center p-8 border rounded-lg bg-accent/20">
          <p className="text-muted-foreground">
            {t("translation.common.noDataFound")}
          </p>
        </div>
      </Layout>
    );
  }

  const isPastShow = show && new Date(show.date) < new Date();

  return (
    <Layout>
      {isPastShow && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("translation.show.pastShow")}</AlertTitle>
          <AlertDescription>
            {t("translation.show.pastShowDescription", {
              date: format(new Date(show.date), "PPP"),
              time: format(new Date(show.date), "p")
            })}
          </AlertDescription>
        </Alert>
      )}

      {isPastShow ? (
        <div className="text-center p-8 border rounded-lg bg-accent/20">
          <p className="text-muted-foreground">
            {t("translation.show.reservationsNotAvailable")}
          </p>
        </div>
      ) : (
        <SeatGrid />
      )}
    </Layout>
  );
}
