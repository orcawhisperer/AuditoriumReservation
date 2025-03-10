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
import { Show, insertShowSchema, User } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Loader2, Trash2, Shield, CalendarPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";

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

          <Card className="border-2 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Manage Users</CardTitle>
              </div>
              <CardDescription>
                View and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserList />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function ShowForm() {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(insertShowSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
      poster: "",
    },
  });

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue("poster", base64String);
        setPreviewUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

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
      setPreviewUrl("");
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
          name="poster"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poster Image</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                  />
                  {previewUrl && (
                    <div className="relative w-full max-w-lg overflow-hidden rounded-lg border">
                      <div className="relative aspect-video">
                        <img
                          src={previewUrl}
                          alt="Poster preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
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
          <div className="flex gap-4">
            {show.poster && (
              <div className="relative w-16 sm:w-24 overflow-hidden rounded-lg border">
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
              <p className="font-medium">{show.title}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(show.date), "PPP p")}
              </p>
            </div>
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

function UserList() {
  const { toast } = useToast();
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Temporary password: ${data.temporaryPassword}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isEnabled }: { userId: number; isEnabled: boolean }) => {
      const res = await fetch(`/api/users/${userId}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      // Optimistically update the user in the cache
      queryClient.setQueryData<User[]>(["/api/users"], (oldUsers) => {
        if (!oldUsers) return [data];
        return oldUsers.map(user => user.id === data.id ? data : user);
      });

      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user status",
        description: error.message,
        variant: "destructive",
      });
      // Invalidate the query to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <Users className="h-8 w-8 mb-2" />
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{user.username}</p>
              {user.isAdmin && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Account status: {user.isEnabled ? "Active" : "Disabled"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={user.isEnabled}
                onCheckedChange={(checked) =>
                  toggleUserStatusMutation.mutate({ userId: user.id, isEnabled: checked })
                }
                disabled={user.isAdmin || toggleUserStatusMutation.isPending}
              />
              <span className="text-sm">
                {user.isEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={user.isAdmin || resetPasswordMutation.isPending}
                >
                  Reset Password
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Password</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset the user's password to a temporary one. The user
                    will need to change it upon next login.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => resetPasswordMutation.mutate(user.id)}
                  >
                    Reset Password
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}