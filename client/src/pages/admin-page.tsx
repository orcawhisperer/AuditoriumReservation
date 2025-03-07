import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Show, insertShowSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Loader2, Trash2, Shield, CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if not admin
  if (user && !user.isAdmin) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B5320]/10 to-[#4B5320]/5">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Control</h1>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-primary" />
                <CardTitle>Add New Show</CardTitle>
              </div>
              <CardDescription>
                Schedule a new show in the auditorium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShowForm />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Manage Shows</CardTitle>
              <CardDescription>
                View and manage scheduled shows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShowList />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ShowForm() {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertShowSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
      price: 0,
    },
  });

  const createShowMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      form.reset();
      toast({
        title: "Success",
        description: "Show created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create show",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => createShowMutation.mutate(data))}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter show title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date and Time</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter ticket price"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={createShowMutation.isPending}
        >
          {createShowMutation.isPending && (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          )}
          Create Show
        </Button>
      </form>
    </Form>
  );
}

function ShowList() {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (shows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <CalendarPlus className="h-8 w-8 mb-2" />
        <p>No shows scheduled</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shows.map((show) => (
        <div
          key={show.id}
          className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div>
            <p className="font-medium">{show.title}</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(show.date), "PPP p")}
            </p>
            <p className="text-sm font-medium text-primary">
              ${show.price}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteShowMutation.mutate(show.id)}
            disabled={deleteShowMutation.isPending}
          >
            {deleteShowMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}