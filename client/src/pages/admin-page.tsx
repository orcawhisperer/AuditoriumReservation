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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Show, insertShowSchema, User, insertUserSchema, insertReservationSchema } from "@shared/schema";
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
  Ticket,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
// Define Seat component internally to avoid dependency on external component
// This component is similar to the one in seat-grid.tsx but sized differently for admin panel

// Seat component definition for admin panel
function Seat({
  seatId,
  isReserved,
  isBlocked,
  isSelected,
  onSelect,
}: {
  seatId: string;
  isReserved: boolean;
  isBlocked: boolean;
  isSelected: boolean;
  onSelect: (seatId: string) => void;
}) {
  // Extract just the seat number from the end of the seatId
  const seatNumber = seatId.match(/\d+$/)?.[0] || seatId;

  return (
    <button
      className={cn(
        "w-6 h-6 rounded border-2 text-xs font-medium transition-colors shadow-sm",
        isReserved && "bg-red-100 border-red-200 text-red-500 cursor-not-allowed",
        isBlocked && "bg-yellow-100 border-yellow-200 text-yellow-500 cursor-not-allowed",
        isSelected && "bg-primary border-primary text-primary-foreground",
        !isReserved && !isBlocked && !isSelected && "hover:bg-accent hover:border-accent hover:text-accent-foreground active:scale-95",
      )}
      disabled={isReserved || isBlocked}
      onClick={() => onSelect(seatId)}
    >
      {seatNumber}
    </button>
  );
}

interface Reservation {
  id: number;
  showId: number;
  userId: number;
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
      blockedSeats: "",
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input placeholder="Enter show title" {...field} className="flex-1" />
                  <FormField
                    control={form.control}
                    name="emoji"
                    render={({ field }) => (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-12"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            name="themeColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  Theme Color
                  <Palette className="h-4 w-4" />
                </FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Input type="color" {...field} className="h-10 w-20 p-1" />
                    <Input {...field} placeholder="#4B5320" className="font-mono flex-1" />
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
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
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

function EditShowDialog({
  show,
  onClose,
}: {
  show: Show;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const isPastShow = new Date(show.date) < new Date();

  // Show warning if trying to edit a past show
  if (isPastShow) {
    toast({
      title: "Cannot Edit Past Show",
      description: "Shows that have already passed cannot be edited.",
      variant: "destructive",
    });
    onClose();
    return null;
  }

  const form = useForm({
    resolver: zodResolver(insertShowSchema),
    defaultValues: {
      title: show.title,
      date: new Date(show.date).toISOString().slice(0, 16),
      poster: show.poster || "",
      description: show.description || "",
      themeColor: show.themeColor || "#4B5320",
      emoji: show.emoji || "🎭",
      blockedSeats: JSON.parse(show.blockedSeats || "[]").join(","),
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
          <DialogDescription>
            Update show details and configuration.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              editShowMutation.mutate(data),
            )}
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
                              const emojis = [
                                "🎭",
                                "🎪",
                                "🎫",
                                "🎬",
                                "🎸",
                                "🎹",
                                "🎺",
                                "🎻",
                              ];
                              const currentIndex = emojis.indexOf(
                                field.value || "🎭",
                              );
                              const nextEmoji =
                                emojis[(currentIndex + 1) % emojis.length];
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
                    Enter comma-separated seat numbers to block (e.g.,
                    BA1,BB2,DN1)
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
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={editShowMutation.isPending}>
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
    staleTime: 0,
  });
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<
    Reservation[]
  >({
    queryKey: ["/api/reservations"],
    staleTime: 0,
  });
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    staleTime: 0,
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
      return (
        total +
        section.rows.reduce((sectionTotal: number, row: any) => {
          return sectionTotal + row.seats.length;
        }, 0)
      );
    }, 0);
  };
  const getUserName = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name || user.username : "Unknown User";
  };
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(shows.length / itemsPerPage);
  const paginatedShows = shows.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

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
      <div className="space-y-4 h-[400px] overflow-y-auto pr-2">
        {paginatedShows.map((show) => {
          const showReservations = getShowReservations(show.id);
          const bookedSeats = getBookedSeats(show.id);
          const blockedSeats = JSON.parse(show.blockedSeats || "[]");
          const totalSeats = calculateTotalSeats(show);
          const availableSeats =
            totalSeats - bookedSeats.length - blockedSeats.length;
          const isPastShow = new Date(show.date) < new Date();
          return (
            <div
              key={show.id}
              className={`flex flex-col sm:flex-row justify-between gap-4 p-4 border-2 rounded-lg hover:bg-accent/50 transition-colors ${isPastShow ? 'opacity-75' : ''}`}
              style={{
                borderColor: show.themeColor || "#4B5320",
                backgroundColor: `${show.themeColor}10` || "#4B532010",
              }}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {show.poster && (
                  <div className="relative w-full sm:w-24 overflow-hidden rounded-lg border">
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
                    <p className="font-medium">
                      {show.emoji} {show.title}
                    </p>
                    {isPastShow && (
                      <Badge variant="outline" className="text-xs">Past Show</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(show.date), "PPP p")}
                  </p>
                  {show.description && (
                    <p className="text-sm text-muted-foreground">
                      {show.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
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
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingShow(show)}
                  disabled={isPastShow}
                  className="w-full sm:w-auto"
                >
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteShowMutation.isPending || isPastShow}
                      className="w-full sm:w-auto"
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
                      <AlertDialogAction onClick={() => deleteShowMutation.mutate(show.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
        {shows.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <CalendarPlus className="h-8 w-8 mb-2" />
            <p>No shows scheduled</p>
          </div>
        )}
      </div>

      {shows.length > itemsPerPage && (
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
      )}
      {editingShow && (
        <EditShowDialog show={editingShow} onClose={() => setEditingShow(null)} />
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
          <DialogDescription>
            Create a new user account with all required information.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              createUserMutation.mutate(data),
            )}
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
                    <Input
                      type="password"
                      placeholder="Enter password"
                      {...field}
                    />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
              <Button type="submit" disabled={createUserMutation.isPending}>
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

function EditUserDialog({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
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
            onSubmit={form.handleSubmit((data) =>
              editUserMutation.mutate(data),
            )}
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
                  <FormLabel>
                    New Password (leave blank to keep current)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      {...field}
                    />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={editUserMutation.isPending}>
                {editUserMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Update User              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UserList() {
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    staleTime: 1000,
  });
  const { user: currentUser } = useAuth();
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      isEnabled,
    }: {
      userId: number;
      isEnabled: boolean;
    }) => {
      const res = await fetch(`/api/users/${userId}/toggle-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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
    },
  });

  const toggleAdminStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      isAdmin,
    }: {
      userId: number;
      isAdmin: boolean;
    }) => {
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4 h-[400px] overflow-y-auto pr-2">
        {paginatedUsers.map((user) => (
          <div
            key={user.id}
            className="flex flex-col sm:flex-row justify-between gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{user.username}</p>
                {user.isAdmin && (
                  <Badge variant="default" className="text-xs">
                    Admin
                  </Badge>
                )}
              </div>
              {user.name && (
                <p className="text-sm text-muted-foreground">{user.name}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {user.gender}, {user.dateOfBirth}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={user.isEnabled}
                  onCheckedChange={(checked) =>
                    toggleUserStatusMutation.mutate({
                      userId: user.id,
                      isEnabled: checked,
                    })
                  }
                  disabled={user.isAdmin || toggleUserStatusMutation.isPending}
                />
                <span className="text-sm">
                  {user.isEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetPasswordMutation.mutate(user.id)}
                  disabled={user.isAdmin || resetPasswordMutation.isPending}
                  className="flex-1 sm:flex-none"
                >
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(user)}
                  className="flex-1 sm:flex-none"
                >
                  Edit
                </Button>
              </div>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Users className="h-8 w-8 mb-2" />
            <p>No users found</p>
          </div>
        )}
      </div>

      {filteredUsers.length > itemsPerPage && (
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
      )}
      {editingUser && (
        <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />
      )}
    </div>
  );
}

function ReservationManagement() {
  const { toast } = useToast();
  const [selectedShowId, setSelectedShowId] = useState<string>("all");
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);

  const { data: shows = [], isLoading: showsLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
    staleTime: 1000,
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<
    Reservation[]
  >({
    queryKey: ["/api/reservations"],
    staleTime: 1000,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    staleTime: 1000,
  });

  const deleteReservationMutation = useMutation({
    mutationFn: async (reservationId: number) => {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete reservation");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Success",
        description: "Reservation deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete reservation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getShowTitle = (showId: number) => {
    const show = shows.find((s) => s.id === showId);
    return show ? show.title : "Unknown Show";
  };

  const getUserName = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    return user ? user.name || user.username : "Unknown User";
  };

  const filteredReservations = useMemo(() => {
    if (selectedShowId === "all") return reservations;
    const showId = parseInt(selectedShowId, 10);
    return reservations.filter((r) => r.showId === showId);
  }, [selectedShowId, reservations]);

  const itemsPerPage = 5;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const paginatedReservations = filteredReservations.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  if (showsLoading || reservationsLoading || usersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manage Reservations</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Reservations</CardTitle>
        <CardDescription>View and manage all show reservations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedShowId} onValueChange={setSelectedShowId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by show" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shows</SelectItem>
                {shows.map((show) => (
                  <SelectItem key={show.id} value={show.id.toString()}>
                    {show.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 h-[400px] overflow-y-auto pr-2">
            {paginatedReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {getShowTitle(reservation.showId)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Reserved by: {getUserName(reservation.userId)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Seats: {JSON.parse(reservation.seatNumbers).join(", ")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingReservation(reservation)}
                  >
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteReservationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Reservation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this reservation? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteReservationMutation.mutate(reservation.id)
                          }
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
            {filteredReservations.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Ticket className="h-8 w-8 mb-2" />
                <p>
                  {selectedShowId === "all"
                    ? "No reservations found"
                    : "No reservations found for this show"}
                </p>
              </div>
            )}
          </div>

          {filteredReservations.length > itemsPerPage && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setPage(pageNum)}
                        isActive={page === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </CardContent>
      {editingReservation && (
        <EditReservationDialog
          reservation={editingReservation}
          shows={shows}
          onClose={() => setEditingReservation(null)}
        />
      )}
    </Card>
  );
}

function EditReservationDialog({
  reservation,
  onClose,
  shows,
}: {
  reservation: Reservation;
  onClose: () => void;
  shows: Show[];
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(
    JSON.parse(reservation.seatNumbers),
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: showReservations = [] } = useQuery<Reservation[]>({
    queryKey: [`/api/reservations/show/${reservation.showId}`],
    staleTime: 0,
  });

  const currentShow = shows.find((s) => s.id === reservation.showId);

  const form = useForm({
    resolver: zodResolver(insertReservationSchema),
    defaultValues: {
      showId: reservation.showId,
      seatNumbers: JSON.parse(reservation.seatNumbers),
    },
  });

  const reservedSeats = useMemo(() => {
    return new Set(
      showReservations
        .filter((r) => r.id !== reservation.id)
        .flatMap((r) => JSON.parse(r.seatNumbers)),
    );
  }, [showReservations, reservation.id]);

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((current) => {
      if (current.includes(seatId)) {
        return current.filter((id) => id !== seatId);
      }
      if (current.length >= 4) {
        toast({
          title: "Maximum seats reached",
          description: "You can only reserve up to 4 seats",
          variant: "destructive",
        });
        return current;
      }
      return [...current, seatId].sort();
    });
  };

  const editReservationMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        seatNumbers: selectedSeats,
      };

      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/reservations/show/${reservation.showId}`],
      });
      setOpen(false);
      onClose();
      toast({
        title: "Success",
        description: "Reservation updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update reservation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  if (!currentShow) return null;

  const layout = JSON.parse(currentShow.seatLayout);
  const blockedSeats = new Set(JSON.parse(currentShow.blockedSeats || "[]"));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit Reservation</DialogTitle>
          <DialogDescription>
            Update reservation details and seat assignments for {currentShow.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <div className="space-y-4">
            {layout.map((section: any) => (
              <div key={section.section} className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {section.section}
                  <span className="text-sm text-muted-foreground font-normal">
                    {section.section === "Balcony" ? "(Prefix: B)" : "(Prefix: D)"}
                  </span>
                </h3>
                <div className="w-full bg-muted/30 p-4 sm:p-8 rounded-lg shadow-inner overflow-x-auto">
                  <div className="space-y-3 min-w-fit">
                    {section.rows.map((rowData: any) => (
                      <div key={rowData.row} className="flex gap-3 justify-center">
                        <span className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                          {rowData.row}
                        </span>
                        <div className="flex gap-2 sm:gap-3">
                          {Array.from({ length: Math.max(...rowData.seats) }).map(
                            (_, seatIndex) => {
                              const seatNumber = seatIndex + 1;
                              const prefix = section.section === "Balcony" ? "B" : "D";
                              const seatId = `${prefix}${rowData.row}${seatNumber}`;

                              if (!rowData.seats.includes(seatNumber)) {
                                return <div key={seatId} className="w-6 sm:w-8" />;
                              }

                              return (
                                <Seat
                                  key={seatId}
                                  seatId={seatId}
                                  isReserved={reservedSeats.has(seatId)}
                                  isBlocked={blockedSeats.has(seatId)}
                                  isSelected={selectedSeats.includes(seatId)}
                                  onSelect={handleSeatSelect}
                                />
                              );
                            }
                          )}
                        </div>
                        <span className="w-6 flex items-center justify-center text-sm text-muted-foreground">
                          {rowData.row}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary border-2 border-primary" />
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-200" />
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-200" />
                <span>Blocked</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Selected: {selectedSeats.join(", ")}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowConfirm(true)}
                  disabled={editReservationMutation.isPending || selectedSeats.length === 0}
                  className="flex-1 sm:flex-none"
                >
                  Update Reservation
                </Button>
              </div>
            </div>
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
            <AlertDialogAction
              onClick={() => {
                editReservationMutation.mutate({
                  showId: currentShow.id,
                  seatNumbers: selectedSeats,
                });
                setShowConfirm(false);
              }}
            >
              {editReservationMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

function UserManagement() {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
      <CreateUserDialog />
      <UserList />
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("shows");

  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
            className="w-full sm:w-auto"
          >
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-4 sm:py-8 px-4 sm:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:grid-cols-none sm:flex gap-2">
              <TabsTrigger value="shows" className="flex items-center gap-2">
                <CalendarPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Shows</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">Reservations</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="shows" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create Show</CardTitle>
                  <CardDescription>Add a new show to the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <ShowForm />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Show Management</CardTitle>
                  <CardDescription>
                    Manage existing shows and their configurations
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto pr-4">
                  <ShowList />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto pr-4">
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reservations">
            <ReservationManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}