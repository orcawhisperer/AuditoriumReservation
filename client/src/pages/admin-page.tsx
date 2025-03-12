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
import { Show, insertShowSchema, User, insertUserSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import {
  Loader2,
  Trash2,
  Shield,
  CalendarPlus,
  Users,
  Search,
  Star,
  UserPlus,
  Palette,
  Smile,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Reservation {
  id: number;
  showId: number;
  seatNumbers: string;
}


function ShowForm() {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(insertShowSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().slice(0, 16),
      poster: "",
      description: "",
      themeColor: "#4B5320",
      emoji: "🎭",
      blockedSeats: "", // Added blockedSeats to defaultValues
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
                <div className="flex gap-2">
                  <Input placeholder="Enter show title" {...field} />
                  <FormField
                    control={form.control}
                    name="emoji"
                    render={({ field }) => (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-12"
                        onClick={() => {
                          const emojis = ["🎭", "🎪", "🎫", "🎬", "🎸", "🎹", "🎺", "🎻"];
                          const currentIndex = emojis.indexOf(field.value || "🎭");
                          const nextEmoji = emojis[(currentIndex + 1) % emojis.length];
                          field.onChange(nextEmoji);
                        }}
                      >
                        {field.value || "🎭"}
                      </Button>
                    )}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="blockedSeats"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blocked Seats</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter seats to block (e.g., A1,B2,N1)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground">
                Enter comma-separated seat numbers to block (e.g., A1,B2,N1)
              </p>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Enter show description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="themeColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Theme Color
                  <Palette className="h-4 w-4" />
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      {...field}
                      className="h-10 w-20 p-1"
                    />
                    <Input
                      {...field}
                      placeholder="#4B5320"
                      className="font-mono"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

function EditShowDialog({ show, onClose }: { show: Show; onClose: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);

  const form = useForm({
    resolver: zodResolver(insertShowSchema),
    defaultValues: {
      title: show.title,
      date: new Date(show.date).toISOString().slice(0, 16),
      poster: show.poster || "",
      description: show.description || "",
      themeColor: show.themeColor || "#4B5320",
      emoji: show.emoji || "🎭",
      blockedSeats: JSON.parse(show.blockedSeats || "[]").join(","), // Parse the JSON array back to comma-separated string
    },
  });

  const editShowMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/shows/${show.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      setOpen(false);
      onClose();
      toast({
        title: "Success",
        description: "Show updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update show",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Show</DialogTitle>
          <DialogDescription>Update show details and configuration.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => editShowMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input placeholder="Enter show title" {...field} />
                      <FormField
                        control={form.control}
                        name="emoji"
                        render={({ field }) => (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-12"
                            onClick={() => {
                              const emojis = ["🎭", "🎪", "🎫", "🎬", "🎸", "🎹", "🎺", "🎻"];
                              const currentIndex = emojis.indexOf(field.value || "🎭");
                              const nextEmoji = emojis[(currentIndex + 1) % emojis.length];
                              field.onChange(nextEmoji);
                            }}
                          >
                            {field.value || "🎭"}
                          </Button>
                        )}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="blockedSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blocked Seats</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter seats to block (e.g., BA1,BB2,DN1)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Enter comma-separated seat numbers to block (e.g., BA1,BB2,DN1)
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter show description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <FormField
              control={form.control}
              name="themeColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Theme Color
                    <Palette className="h-4 w-4" />
                  </FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        {...field}
                        className="h-10 w-20 p-1"
                      />
                      <Input
                        {...field}
                        placeholder="#4B5320"
                        className="font-mono"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editShowMutation.isPending}
              >
                {editShowMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Update Show
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ShowList() {
    const { toast } = useToast();
    const [editingShow, setEditingShow] = useState<Show | null>(null);
    const { data: shows = [], isLoading } = useQuery<Show[]>({
      queryKey: ["/api/shows"],
      staleTime: 0, // Add staleTime: 0 to ensure real-time updates
    });

    const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
      queryKey: ["/api/reservations"],
      staleTime: 0, // Add staleTime: 0 to ensure real-time updates
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

    const getShowReservations = (showId: number) => {
      return reservations.filter((r) => r.showId === showId);
    };

    const getBookedSeats = (showId: number) => {
      const showReservations = getShowReservations(showId);
      return showReservations.flatMap((r) => JSON.parse(r.seatNumbers));
    };

    const calculateTotalSeats = (show: Show) => {
      const layout = JSON.parse(show.seatLayout);
      return layout.reduce((total: number, section: any) => {
        return total + section.rows.reduce((sectionTotal: number, row: any) => {
          return sectionTotal + row.seats.length;
        }, 0);
      }, 0);
    };

    if (isLoading || reservationsLoading) {
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
        {shows.map((show) => {
          const showReservations = getShowReservations(show.id);
          const bookedSeats = getBookedSeats(show.id);
          const blockedSeats = JSON.parse(show.blockedSeats || "[]");
          const totalSeats = calculateTotalSeats(show);
          const availableSeats = totalSeats - bookedSeats.length - blockedSeats.length;

          return (
            <div
              key={show.id}
              className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-accent/50 transition-colors"
              style={{
                borderColor: show.themeColor || "#4B5320",
                backgroundColor: `${show.themeColor}10` || "#4B532010",
              }}
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
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{show.emoji} {show.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(show.date), "PPP p")}
                  </p>
                  {show.description && (
                    <p className="text-sm text-muted-foreground">
                      {show.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-500">
                      {availableSeats} Available
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/10 text-red-500">
                      {bookedSeats.length} Booked
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-500">
                      {blockedSeats.length} Blocked
                    </span>
                  </div>
                  {showReservations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Reservations:</p>
                      <div className="space-y-1">
                        {showReservations.map((reservation) => (
                          <div key={reservation.id} className="text-sm text-muted-foreground">
                            • Seats {JSON.parse(reservation.seatNumbers).join(", ")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingShow(show)}
                >
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteShowMutation.isPending}
                    >
                      {deleteShowMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Show</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this show? This action cannot be undone.
                        {showReservations.length > 0 && (
                          <p className="mt-2 text-red-500">
                            Warning: This show has {showReservations.length} active reservations.
                          </p>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteShowMutation.mutate(show.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
        {editingShow && (
          <EditShowDialog
            show={editingShow}
            onClose={() => setEditingShow(null)}
          />
        )}
      </div>
    );
  }

function CreateUserDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      gender: "male",
      dateOfBirth: "",
      isAdmin: false,
      isEnabled: true,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      form.reset();
      setOpen(false);
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Create a new user account with all required information.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createUserMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Create User
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: user.username,
      password: "",
      name: user.name || "",
      gender: user.gender || "other",
      dateOfBirth: user.dateOfBirth || "",
      isAdmin: user.isAdmin,
      isEnabled: user.isEnabled,
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setOpen(false);
      onClose();
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user account details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => editUserMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password (leave blank to keep current)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editUserMutation.isPending}
              >
                {editUserMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Update User
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UserList() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const itemsPerPage = 5;

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const isPrimaryAdmin = currentUser?.id === users.find((u) => u.isAdmin)?.id;

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
      queryClient.setQueryData<User[]>(["/api/users"], (oldUsers) => {
        if (!oldUsers) return [data];
        return oldUsers.map((user) => (user.id === data.id ? data : user));
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
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });

  const toggleAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const res = await fetch(`/api/users/${userId}/toggle-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData<User[]>(["/api/users"], (oldUsers) => {
        if (!oldUsers) return [data];
        return oldUsers.map((user) => (user.id === data.id ? data : user));
      });

      toast({
        title: "Success",
        description: "Admin status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update admin status",
        description: error.message,
        variant: "destructive",
      });
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
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <CreateUserDialog />
      </div>

      {paginatedUsers.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-4 border-2 rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{user.username}</p>
              {user.isAdmin && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary flex items-center gap-1">
                  {user.id === users.find((u) => u.isAdmin)?.id && (
                    <Star className="h-3 w-3" />
                  )}
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Name: {user.name || "Not set"}
            </p>
            <p className="text-sm text-muted-foreground">
              Gender: {user.gender || "Not set"}
            </p>
            <p className="text-sm text-muted-foreground">
              Date of Birth: {user.dateOfBirth ? format(new Date(user.dateOfBirth), "PPP") : "Not set"}
            </p>
            <p className="text-sm text-muted-foreground">
              Account status: {user.isEnabled ? "Active" : "Disabled"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {isPrimaryAdmin && user.id !== currentUser?.id && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={user.isAdmin}
                  onCheckedChange={(checked) =>
                    toggleAdminStatusMutation.mutate({ userId: user.id, isAdmin: checked })
                  }
                  disabled={toggleAdminStatusMutation.isPending}
                />
                <span className="text-sm">Admin</span>
              </div>
            )}

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingUser(user)}
            >
              Edit
            </Button>
          </div>
        </div>
      ))}

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {filteredUsers.length > itemsPerPage && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => setPage(pageNum)}
                    isActive={page === pageNum}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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

export default AdminPage;