import { Calendar } from "@/components/ui/calendar";
import { Show } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ShowCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const { toast } = useToast();

  const { data: shows = [], isLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  const deleteShowMutation = useMutation({
    mutationFn: async (showId: number) => {
      const res = await fetch(`/api/shows/${showId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete show");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      setSelectedShow(null);
      toast({
        title: "Success",
        description: "Show deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete show",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const showDates = shows.reduce((acc, show) => {
    const date = new Date(show.date);
    const key = format(date, "yyyy-MM-dd");
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(show);
    return acc;
  }, {} as Record<string, Show[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const selectedDateShows = showDates[selectedDateKey] || [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="border rounded-lg p-4"
          modifiers={{
            hasShow: (date) => {
              const key = format(date, "yyyy-MM-dd");
              return key in showDates;
            },
          }}
          modifiersClassNames={{
            hasShow: "font-bold text-primary",
          }}
        />

        <div className="space-y-4">
          <h3 className="font-medium">
            Shows on {selectedDate ? format(selectedDate, "PPP") : "selected date"}
          </h3>
          {selectedDateShows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shows scheduled</p>
          ) : (
            <div className="space-y-2">
              {selectedDateShows.map((show) => (
                <div
                  key={show.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
                  onClick={() => setSelectedShow(show)}
                >
                  <div>
                    <p className="font-medium">{show.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(show.date), "p")} - ${show.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedShow} onOpenChange={() => setSelectedShow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Show Details</DialogTitle>
            <DialogDescription>
              Manage the selected show
            </DialogDescription>
          </DialogHeader>

          {selectedShow && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedShow.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedShow.date), "PPP p")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Price: ${selectedShow.price}
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteShowMutation.mutate(selectedShow.id)}
                  disabled={deleteShowMutation.isPending}
                >
                  {deleteShowMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Show
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
