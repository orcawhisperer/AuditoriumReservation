import { Button } from "@/components/ui/button";
import { SeatGrid } from "@/components/seat-grid-new"; // Import the new seat grid component
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Show,
  insertShowSchema,
  User,
  insertUserSchema,
  insertReservationSchema,
} from "@shared/schema";
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
  Eye,
  Share2,
  Copy,
  Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import { DataPagination } from "@/components/data-pagination";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/footer";

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
// Exit component for auditorium layout
function Exit({ position }: { position: "left" | "right" | "top" | "bottom" }) {
  const getPositionClasses = () => {
    switch (position) {
      case "left":
        return "flex-row justify-start";
      case "right":
        return "flex-row justify-end";
      case "top":
        return "flex-col justify-start";
      case "bottom":
        return "flex-col justify-end";
    }
  };

  return (
    <div className={`flex items-center ${getPositionClasses()} mx-2 my-3`}>
      <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
        EXIT
      </div>
    </div>
  );
}

function Seat({
  seatId,
  isReserved,
  isBlocked,
  isSelected,
  isUserReservation,
  onSelect,
}: {
  seatId: string;
  isReserved: boolean;
  isBlocked: boolean;
  isSelected: boolean;
  isUserReservation?: boolean;
  onSelect: (seatId: string) => void;
}) {
  // Extract just the seat number from the end of the seatId
  const seatNumber = seatId.match(/\d+$/)?.[0] || seatId;

  return (
    <button
      className={cn(
        "w-6 h-6 rounded border-2 text-xs font-medium transition-colors shadow-sm",
        isUserReservation &&
          "bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed",
        isReserved &&
          !isUserReservation &&
          "bg-red-100 border-red-200 text-red-500 cursor-not-allowed",
        isBlocked &&
          "bg-yellow-100 border-yellow-200 text-yellow-500 cursor-not-allowed",
        isSelected && "bg-primary border-primary text-primary-foreground",
        !isReserved &&
          !isBlocked &&
          !isSelected &&
          "hover:bg-accent hover:border-accent hover:text-accent-foreground active:scale-95",
      )}
      disabled={isReserved || isBlocked}
      onClick={() => onSelect(seatId)}
      title={isUserReservation ? "Your reservation" : ""}
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
  const [foodMenuPreview, setFoodMenuPreview] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isTemplateSelectOpen, setIsTemplateSelectOpen] = useState<boolean>(false);

  // Fetch all existing shows to use as templates
  const { data: existingShows = [] } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });
  
  // Filter shows based on search term
  const filteredShows = useMemo(() => {
    if (!searchTerm.trim()) return existingShows;
    
    const lowerSearch = searchTerm.toLowerCase();
    return existingShows.filter(show => 
      show.title.toLowerCase().includes(lowerSearch) ||
      show.description?.toLowerCase().includes(lowerSearch)
    );
  }, [existingShows, searchTerm]);

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
      allowedCategories: ["single", "family", "fafa"],
      fafaExclusiveRows: "",
      foodMenu: "",
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

  const handleFoodMenuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue("foodMenu", base64String);
        setFoodMenuPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Function to load template data from an existing show
  const loadTemplateData = (templateShow: Show) => {
    form.setValue("title", templateShow.title);
    form.setValue("description", templateShow.description || "");
    form.setValue("themeColor", templateShow.themeColor || "#4B5320");
    form.setValue("emoji", templateShow.emoji || "🎭");
    form.setValue("blockedSeats", Array.isArray(templateShow.blockedSeats) 
      ? templateShow.blockedSeats.join(",") 
      : (typeof templateShow.blockedSeats === 'string' 
          ? (templateShow.blockedSeats.includes('[') ? JSON.parse(templateShow.blockedSeats).join(",") : templateShow.blockedSeats) 
          : ""));
    form.setValue("fafaExclusiveRows", Array.isArray(templateShow.fafaExclusiveRows) 
      ? templateShow.fafaExclusiveRows.join(",") 
      : (typeof templateShow.fafaExclusiveRows === 'string' 
          ? (templateShow.fafaExclusiveRows.includes('[') ? JSON.parse(templateShow.fafaExclusiveRows).join(",") : templateShow.fafaExclusiveRows) 
          : ""));
    
    // Always set a new date as default
    form.setValue("date", new Date().toISOString().slice(0, 16));
    
    // Load poster if exists
    if (templateShow.poster) {
      form.setValue("poster", templateShow.poster);
      setPreviewUrl(templateShow.poster);
    }
    
    setIsTemplateSelectOpen(false);
    toast({
      title: "Template Loaded",
      description: `Data loaded from "${templateShow.title}". Don't forget to update the date!`,
    });
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
      setFoodMenuPreview("");
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
      <div className="mb-4">
        <Dialog open={isTemplateSelectOpen} onOpenChange={setIsTemplateSelectOpen}>
          <DialogTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center gap-2"
            >
              <CalendarPlus className="h-4 w-4" />
              Use Existing Show as Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Choose a Show Template</DialogTitle>
              <DialogDescription>
                Select an existing show to reuse its data for creating a new show.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shows..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
                {filteredShows.length > 0 ? (
                  filteredShows.map((show) => (
                    <Card 
                      key={show.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => loadTemplateData(show)}
                    >
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          {show.emoji || "🎭"} {show.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {format(new Date(show.date), "PPP")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        {show.poster && (
                          <div className="w-full h-20 overflow-hidden rounded mb-2">
                            <img 
                              src={show.poster} 
                              alt={show.title}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {show.description || "No description"}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p>No shows found matching your search</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
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
                  <Input
                    placeholder="Enter show title"
                    {...field}
                    className="flex-1"
                  />
                  <FormField
                    control={form.control}
                    name="emoji"
                    render={({ field }) => (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-12"
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
                    <Input
                      {...field}
                      placeholder="#4B5320"
                      className="font-mono flex-1"
                    />
                  </div>
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
                <FormLabel>Ticket Price (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
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

        <FormField
          control={form.control}
          name="foodMenu"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food Menu Image</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFoodMenuChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                  />
                  {foodMenuPreview && (
                    <div className="relative w-full max-w-lg overflow-hidden rounded-lg border">
                      <div className="relative aspect-video">
                        <img
                          src={foodMenuPreview}
                          alt="Food menu preview"
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

        <FormField
          control={form.control}
          name="allowedCategories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allowed User Categories</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {["single", "family", "fafa"].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Switch
                          checked={field.value.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, category]);
                            } else {
                              field.onChange(field.value.filter((c: string) => c !== category));
                            }
                          }}
                        />
                        <label className="text-sm font-medium capitalize">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select which user categories can book tickets for this show
                  </p>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fafaExclusiveRows"
          render={({ field }) => (
            <FormItem>
              <FormLabel>FAFA-Exclusive Rows (Optional)</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input
                    placeholder="Enter row identifiers (e.g., A,B or R1,R2)"
                    value={Array.isArray(field.value) ? field.value.join(",") : field.value || ""}
                    onChange={(e) => {
                      // Keep as string during typing, convert to uppercase
                      field.onChange(e.target.value.toUpperCase());
                    }}
                  />
                  <p className="text-sm text-muted-foreground">
                    Mark specific rows as FAFA-only. Only users with FAFA category can book these seats.
                  </p>
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
  const [previewUrl, setPreviewUrl] = useState<string>(show.poster || "");
  const [foodMenuPreview, setFoodMenuPreview] = useState<string>(show.foodMenu || "");
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
      price: show.price || 0,
      blockedSeats: Array.isArray(show.blockedSeats) 
        ? show.blockedSeats.join(",") 
        : (typeof show.blockedSeats === 'string' 
            ? (show.blockedSeats.includes('[') ? JSON.parse(show.blockedSeats).join(",") : show.blockedSeats) 
            : ""),
      allowedCategories: Array.isArray(show.allowedCategories) 
        ? show.allowedCategories 
        : (typeof show.allowedCategories === 'string' && show.allowedCategories.length > 0 
            ? (show.allowedCategories.startsWith('[') ? JSON.parse(show.allowedCategories) : ["single", "family", "fafa"])
            : ["single", "family", "fafa"]),
      fafaExclusiveRows: Array.isArray(show.fafaExclusiveRows) 
        ? show.fafaExclusiveRows.join(',')
        : (typeof show.fafaExclusiveRows === 'string' && show.fafaExclusiveRows.length > 0 
            ? (show.fafaExclusiveRows.startsWith('[') ? JSON.parse(show.fafaExclusiveRows).join(',') : show.fafaExclusiveRows)
            : ""),
      foodMenu: show.foodMenu || "",
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

  const handleFoodMenuChangeEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        form.setValue("foodMenu", base64String);
        setFoodMenuPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Show</DialogTitle>
          <DialogDescription>
            Update show details and configuration.
          </DialogDescription>
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
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Price (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
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

            <FormField
              control={form.control}
              name="foodMenu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Food Menu Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFoodMenuChangeEdit}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium"
                      />
                      {foodMenuPreview && (
                        <div className="relative w-full max-w-lg overflow-hidden rounded-lg border">
                          <div className="relative aspect-video">
                            <img
                              src={foodMenuPreview}
                              alt="Food menu preview"
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

            <FormField
              control={form.control}
              name="allowedCategories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowed User Categories</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {["single", "family", "fafa"].map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Switch
                              checked={field.value.includes(category)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, category]);
                                } else {
                                  field.onChange(field.value.filter((c: string) => c !== category));
                                }
                              }}
                            />
                            <label className="text-sm font-medium capitalize">
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select which user categories can book tickets for this show
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fafaExclusiveRows"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>FAFA-Exclusive Rows (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter row identifiers (e.g., A,B or R1,R2)"
                        value={Array.isArray(field.value) ? field.value.join(",") : field.value || ""}
                        onChange={(e) => {
                          // Keep as string during typing, convert to uppercase
                          field.onChange(e.target.value.toUpperCase());
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        Mark specific rows as FAFA-only. Only users with FAFA category can book these seats.
                      </p>
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

// Show Details Dialog Component
function ShowDetailsDialog({
  show,
  onClose,
}: {
  show: Show;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const { data: reservations = [] } = useQuery<any[]>({
    queryKey: ["/api/reservations"],
    staleTime: 0,
  });
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    staleTime: 0,
  });

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const showReservations = reservations.filter((r) => r.showId === show.id);
  const bookedSeats = showReservations.flatMap((r) => {
    try {
      return typeof r.seatNumbers === 'string' ? JSON.parse(r.seatNumbers) : r.seatNumbers;
    } catch (e) {
      return [];
    }
  });

  const blockedSeats = Array.isArray(show.blockedSeats) 
    ? show.blockedSeats 
    : (typeof show.blockedSeats === 'string' 
      ? (show.blockedSeats.includes(",") 
        ? show.blockedSeats.split(",").map(s => s.trim()) 
        : (show.blockedSeats ? [show.blockedSeats] : []))
      : []);

  const allowedCategories = Array.isArray(show.allowedCategories) 
    ? show.allowedCategories 
    : (typeof show.allowedCategories === 'string' 
      ? (show.allowedCategories.includes("[") 
        ? JSON.parse(show.allowedCategories) 
        : show.allowedCategories.split(",").map(s => s.trim()))
      : []);

  const fafaExclusiveRows = Array.isArray(show.fafaExclusiveRows) 
    ? show.fafaExclusiveRows 
    : (typeof show.fafaExclusiveRows === 'string' 
      ? (show.fafaExclusiveRows.includes("[") 
        ? JSON.parse(show.fafaExclusiveRows) 
        : show.fafaExclusiveRows.split(",").map(s => s.trim()))
      : []);

  const layout = typeof show.seatLayout === 'string' ? JSON.parse(show.seatLayout) : show.seatLayout;
  const totalSeats = layout.reduce((total: number, section: any) => {
    return total + section.rows.reduce((sectionTotal: number, row: any) => {
      return sectionTotal + row.seats.length;
    }, 0);
  }, 0);

  const availableSeats = totalSeats - bookedSeats.length - blockedSeats.length;

  const handleShare = () => {
    const showUrl = `${window.location.origin}/?show=${show.id}`;
    navigator.clipboard.writeText(showUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Show booking link copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
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
          <DialogDescription>
            Complete show details and booking information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Show Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Info Column */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-lg">{show.emoji}</span>
                  Show Details
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Date & Time:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{format(new Date(show.date), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Time:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{format(new Date(show.date), "h:mm a")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Status:</span>
                    <Badge variant={new Date(show.date) < new Date() ? "secondary" : "default"}>
                      {new Date(show.date) < new Date() ? "Past Show" : "Upcoming"}
                    </Badge>
                  </div>
                  {show.description && (
                    <div className="pt-2 border-t dark:border-gray-600">
                      <span className="text-gray-600 dark:text-gray-300 block mb-1">Description:</span>
                      <p className="text-gray-900 dark:text-gray-100">{show.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories & FAFA */}
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Access Settings</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-300 block mb-2">Allowed Categories:</span>
                    <div className="flex flex-wrap gap-1">
                      {allowedCategories.length > 0 ? (
                        allowedCategories.map((category: string) => (
                          <Badge key={category} variant="outline" className="text-xs capitalize">
                            {category}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">All categories</span>
                      )}
                    </div>
                  </div>
                  {fafaExclusiveRows.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-300 block mb-2">FAFA-Exclusive Rows:</span>
                      <div className="flex flex-wrap gap-1">
                        {fafaExclusiveRows.map((row: string) => (
                          <Badge key={row} className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700">
                            Row {row}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics Column */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Seat Statistics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{availableSeats}</div>
                    <div className="text-xs text-green-600 uppercase tracking-wide">Available</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">{bookedSeats.length}</div>
                    <div className="text-xs text-red-600 uppercase tracking-wide">Booked</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{blockedSeats.length}</div>
                    <div className="text-xs text-yellow-600 uppercase tracking-wide">Blocked</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalSeats}</div>
                    <div className="text-xs text-blue-600 uppercase tracking-wide">Total</div>
                  </div>
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
                        <div 
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.round((bookedSeats.length / totalSeats) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                        {Math.round((bookedSeats.length / totalSeats) * 100)}% capacity filled
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Media Column */}
            <div className="space-y-4">
              {show.poster && (
                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Poster</h3>
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-lg border dark:border-gray-600">
                    <img
                      src={show.poster}
                      alt={`Poster for ${show.title}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {show.foodMenu && (
                <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Food Menu</h3>
                  <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg border dark:border-gray-600">
                    <img
                      src={show.foodMenu}
                      alt="Food menu"
                      className="w-full h-full object-cover"
                    />
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
          <Button onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShowList() {
  const { toast } = useToast();
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [viewingShow, setViewingShow] = useState<Show | null>(null);
  const { data: showsData = [], isLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
    staleTime: 0,
  });
  
  // Sort shows by date (latest first)
  const shows = useMemo(() => {
    return [...showsData].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [showsData]);
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
    return showReservations.flatMap((r) => {
      try {
        return typeof r.seatNumbers === 'string' ? JSON.parse(r.seatNumbers) : r.seatNumbers;
      } catch (e) {
        console.error("Error parsing seat numbers:", e);
        return [];
      }
    });
  };
  const calculateTotalSeats = (show: Show) => {
    const layout = typeof show.seatLayout === 'string' ? JSON.parse(show.seatLayout) : show.seatLayout;
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
      {/* List Layout */}
      <div className="space-y-3">
        {paginatedShows.map((show) => {
          const showReservations = getShowReservations(show.id);
          const bookedSeats = getBookedSeats(show.id);
          const blockedSeats = Array.isArray(show.blockedSeats) 
            ? show.blockedSeats 
            : (typeof show.blockedSeats === 'string' 
              ? (show.blockedSeats.includes(",") 
                ? show.blockedSeats.split(",").map(s => s.trim()) 
                : (show.blockedSeats ? [show.blockedSeats] : []))
              : []);
          const totalSeats = calculateTotalSeats(show);
          const availableSeats = totalSeats - bookedSeats.length - blockedSeats.length;
          const isPastShow = new Date(show.date) < new Date();
          
          return (
            <div 
              key={show.id}
              className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200 ${isPastShow ? "opacity-75" : ""}`}
              style={{
                borderColor: show.themeColor || "#e5e7eb",
                backgroundColor: `${show.themeColor}02` || "#ffffff",
              }}
            >
              {/* Poster Thumbnail */}
              <div className="flex-shrink-0">
                {show.poster ? (
                  <div className="relative w-16 h-16 overflow-hidden rounded-lg border">
                    <img
                      src={show.poster}
                      alt={`Poster for ${show.title}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    className="w-16 h-16 flex items-center justify-center rounded-lg border"
                    style={{ backgroundColor: show.themeColor || "#f3f4f6" }}
                  >
                    <span className="text-2xl">{show.emoji || "🎬"}</span>
                  </div>
                )}
              </div>

              {/* Show Information */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                    {show.title}
                  </h3>
                  {isPastShow && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                      Past Show
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {format(new Date(show.date), "MMM dd, yyyy 'at' h:mm a")}
                </p>
                {show.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2" title={show.description}>
                    {show.description}
                  </p>
                )}
                
                {/* Compact Statistics */}
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {availableSeats} Available
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    {bookedSeats.length} Booked
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    {blockedSeats.length} Blocked
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {totalSeats > 0 ? Math.round((bookedSeats.length / totalSeats) * 100) : 0}% Full
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingShow(show)}
                  className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden md:inline">View</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const showUrl = `${window.location.origin}/?show=${show.id}`;
                    navigator.clipboard.writeText(showUrl).then(() => {
                      toast({
                        title: "Link Copied",
                        description: "Show booking link copied to clipboard",
                      });
                    }).catch(() => {
                      toast({
                        title: "Error",
                        description: "Failed to copy link",
                        variant: "destructive",
                      });
                    });
                  }}
                  className="flex items-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden md:inline">Share</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingShow(show)}
                  disabled={isPastShow}
                  className="flex items-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden md:inline">Edit</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deleteShowMutation.isPending || isPastShow}
                      className="flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                    >
                      {deleteShowMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="hidden md:inline">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Show</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{show.title}"? This action cannot be undone.
                        {showReservations.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 font-medium">
                              ⚠️ Warning: This show has {showReservations.length} active reservation{showReservations.length !== 1 ? 's' : ''}.
                            </p>
                          </div>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteShowMutation.mutate(show.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Show
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Empty State */}
      {shows.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <CalendarPlus className="h-12 w-12 mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No shows scheduled</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create your first show to get started</p>
        </div>
      )}

      {/* Pagination */}
      {shows.length > itemsPerPage && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="cursor-pointer"
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={page === pageNum}
                      className="cursor-pointer"
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
                  className="cursor-pointer"
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      {editingShow && (
        <EditShowDialog
          show={editingShow}
          onClose={() => setEditingShow(null)}
        />
      )}
      {viewingShow && (
        <ShowDetailsDialog
          show={viewingShow}
          onClose={() => setViewingShow(null)}
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
      seatLimit: 4,
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
            <FormField
              control={form.control}
              name="seatLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Seat Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of seats this user can book per show
                  </FormDescription>
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
      seatLimit: user.seatLimit || 4,
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
            <FormField
              control={form.control}
              name="seatLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Seat Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of seats this user can book per show
                  </FormDescription>
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // Create a dialog with a copyable password
      const dialog = document.createElement('dialog');
      dialog.style.padding = '24px';
      dialog.style.borderRadius = '8px';
      dialog.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
      dialog.style.border = '1px solid rgb(229, 231, 235)';
      dialog.style.width = '90%';
      dialog.style.maxWidth = '400px';
      dialog.style.position = 'fixed';
      dialog.style.zIndex = '9999';
      dialog.style.top = '20%';
      dialog.style.left = '50%';
      dialog.style.transform = 'translateX(-50%)';
      dialog.style.backgroundColor = 'white';
      
      const title = document.createElement('h3');
      title.textContent = 'Password Reset Successful';
      title.style.marginTop = '0';
      title.style.marginBottom = '16px';
      title.style.fontSize = '18px';
      title.style.fontWeight = 'bold';
      
      const passContainer = document.createElement('div');
      passContainer.style.marginBottom = '16px';
      passContainer.style.display = 'flex';
      passContainer.style.flexDirection = 'column';
      passContainer.style.gap = '8px';
      
      const passTitle = document.createElement('p');
      passTitle.textContent = 'Temporary password:';
      passTitle.style.margin = '0';
      
      const passInput = document.createElement('input');
      passInput.value = data.temporaryPassword;
      passInput.readOnly = true;
      passInput.style.padding = '8px 12px';
      passInput.style.borderRadius = '4px';
      passInput.style.border = '1px solid rgb(209, 213, 219)';
      passInput.style.backgroundColor = 'rgb(243, 244, 246)';
      passInput.style.fontSize = '16px';
      passInput.style.fontFamily = 'monospace';
      passInput.onclick = () => passInput.select();
      
      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy Password';
      copyButton.style.padding = '8px 16px';
      copyButton.style.backgroundColor = 'rgb(59, 130, 246)';
      copyButton.style.color = 'white';
      copyButton.style.border = 'none';
      copyButton.style.borderRadius = '4px';
      copyButton.style.cursor = 'pointer';
      copyButton.style.marginTop = '8px';
      copyButton.onclick = () => {
        passInput.select();
        document.execCommand('copy');
        copyButton.textContent = 'Copied!';
        setTimeout(() => {
          copyButton.textContent = 'Copy Password';
        }, 2000);
      };
      
      const note = document.createElement('p');
      note.textContent = 'Please share this with the user.';
      note.style.fontSize = '12px';
      note.style.color = 'rgb(107, 114, 128)';
      note.style.marginTop = '8px';
      note.style.marginBottom = '16px';
      
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.style.padding = '8px 16px';
      closeButton.style.backgroundColor = 'rgb(229, 231, 235)';
      closeButton.style.color = 'rgb(17, 24, 39)';
      closeButton.style.border = 'none';
      closeButton.style.borderRadius = '4px';
      closeButton.style.cursor = 'pointer';
      closeButton.onclick = () => {
        dialog.close();
        document.body.removeChild(dialog);
      };
      
      passContainer.appendChild(passTitle);
      passContainer.appendChild(passInput);
      passContainer.appendChild(copyButton);
      
      dialog.appendChild(title);
      dialog.appendChild(passContainer);
      dialog.appendChild(note);
      dialog.appendChild(closeButton);
      
      document.body.appendChild(dialog);
      dialog.showModal();
      
      // Also show regular toast for additional notification
      toast({
        title: "Password Reset Successful",
        description: "A dialog with the temporary password has been opened.",
        duration: 5000,
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
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

function ReservationManagement() {
  const { t } = useTranslation();
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

  const isShowInPast = (showId: number) => {
    const show = shows.find(s => s.id === showId);
    if (!show) return false;
    return new Date(show.date) < new Date();
  };

  const filteredReservations = useMemo(() => {
    if (selectedShowId === "all") return reservations;
    const showId = parseInt(selectedShowId, 10);
    return reservations.filter((r) => r.showId === showId);
  }, [selectedShowId, reservations]);

  const itemsPerPage = 5;
  const [page, setPage] = useState(1);
  const [currentItems, setCurrentItems] = useState<Reservation[]>([]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedShowId]);

  if (showsLoading || reservationsLoading || usersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('translation.admin.manageReservations')}</CardTitle>
          <CardDescription>{t('translation.common.loading')}</CardDescription>
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
        <CardTitle>{t('translation.admin.manageReservations')}</CardTitle>
        <CardDescription>{t('translation.admin.viewAndManageReservations')}</CardDescription>
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

          <div className="h-[400px] overflow-y-auto pr-2">
            {currentItems.length > 0 ? (
              <div className="space-y-4">
                {currentItems.map((reservation: Reservation) => {
                  const isPastShow = isShowInPast(reservation.showId);
                  
                  return (
                    <div
                      key={reservation.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4"
                    >
                      <div>
                        <p className="font-medium">
                          {getShowTitle(reservation.showId)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Reserved by: {getUserName(reservation.userId)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Seats: {(() => {
                            try {
                              if (typeof reservation.seatNumbers === 'string') {
                                return reservation.seatNumbers.startsWith('[')
                                  ? JSON.parse(reservation.seatNumbers).join(", ")
                                  : reservation.seatNumbers;
                              } else if (Array.isArray(reservation.seatNumbers)) {
                                return (reservation.seatNumbers as string[]).join(", ");
                              }
                              return 'No seats';
                            } catch (e) {
                              console.error("Error parsing seat numbers:", e);
                              return 'No seats';
                            }
                          })()}
                        </p>
                        {isPastShow && (
                          <p className="text-xs text-destructive mt-1">
                            Past show - modifications disabled
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        {!isPastShow ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingReservation(reservation)}
                              className="flex-1 sm:flex-none"
                            >
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deleteReservationMutation.isPending}
                                  className="flex-1 sm:flex-none"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
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
                                    onClick={() => deleteReservationMutation.mutate(reservation.id)}
                                  >
                                    {deleteReservationMutation.isPending && (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="flex-1 sm:flex-none"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled
                              className="flex-1 sm:flex-none"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
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

          <DataPagination
            data={filteredReservations}
            itemsPerPage={itemsPerPage}
            currentPage={page}
            onCurrentPageChange={setPage}
            onPageChange={setCurrentItems}
          />
        </div>
      </CardContent>
      {editingReservation && (
        <EditReservationDialog
          reservation={editingReservation}
          shows={shows || []}
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
    typeof reservation.seatNumbers === 'string' 
      ? (reservation.seatNumbers.startsWith('[') 
          ? JSON.parse(reservation.seatNumbers) 
          : reservation.seatNumbers.split(',').map(s => s.trim()))
      : Array.isArray(reservation.seatNumbers) 
          ? reservation.seatNumbers 
          : [],
  );
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: showReservations = [] } = useQuery<Reservation[]>({
    queryKey: [`/api/reservations/show/${reservation.showId}`],
    staleTime: 0,
  });

  // Fetch the user associated with this reservation to get their seat limit
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const reservationUser = users.find((u) => u.id === reservation.userId);
  const userSeatLimit = reservationUser?.seatLimit || 4; // Default to 4 if not found

  const currentShow = shows.find((s) => s.id === reservation.showId);

  const form = useForm({
    resolver: zodResolver(insertReservationSchema),
    defaultValues: {
      showId: reservation.showId,
      seatNumbers: typeof reservation.seatNumbers === 'string' 
        ? (reservation.seatNumbers.startsWith('[') 
            ? JSON.parse(reservation.seatNumbers) 
            : reservation.seatNumbers.split(',').map(s => s.trim()))
        : Array.isArray(reservation.seatNumbers) 
            ? reservation.seatNumbers 
            : [],
    },
  });

  // Fetch user reservations 
  const { data: userReservations = [] } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations/user"],
    staleTime: 0,
  });

  // Use the Auth hook to get the current admin user
  const { user: currentAdmin } = useAuth();
  
  const handleSeatSelect = (seatId: string) => {
    setSelectedSeats((current) => {
      if (current.includes(seatId)) {
        return current.filter((id) => id !== seatId);
      }
      
      // Admin has no seat limit when editing reservations
      if (!currentAdmin?.isAdmin) {
        if (current.length >= userSeatLimit) {
          toast({
            title: "Maximum seats reached",
            description: `You can only reserve up to ${userSeatLimit} seats for this user`,
            variant: "destructive",
          });
          return current;
        }
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
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/user"] });
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit Reservation</DialogTitle>
          <DialogDescription>
            Update reservation details and seat assignments for{" "}
            {currentShow.title}
            <div className="mt-2 text-sm">
              <span className="font-medium">User:</span>{" "}
              {reservationUser?.username || "Unknown"}
              <span className="ml-4 font-medium">Seat Limit:</span>{" "}
              {currentAdmin?.isAdmin ? "Unlimited (Admin)" : userSeatLimit}
              <span className="ml-4 font-medium">Selected Seats:</span>{" "}
              {selectedSeats.join(", ")}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {/* Use the seat-grid-new component instead */}
          <SeatGrid
            showId={currentShow?.id?.toString()}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
            userReservation={reservation}
            hideActionButtons={true}
            isAdminMode={true}
            className="max-h-[70vh]"
          />
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
                <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300" />
                <span>Your Reservation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-200" />
                <span>Blocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-red-500 text-white px-1 py-0.5 rounded text-xs">
                  EXIT
                </div>
                <span>Exit</span>
              </div>
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
                disabled={
                  editReservationMutation.isPending ||
                  selectedSeats.length === 0
                }
                className="flex-1 sm:flex-none"
              >
                {editReservationMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Update Reservation
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Reservation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this reservation? The following
              seats will be assigned:
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
  const { t } = useTranslation();

  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b bg-background dark:bg-gray-800">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{t('translation.common.appName')} {t('translation.common.admin')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="w-full sm:w-auto"
            >
              {t('translation.admin.backToHome')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-4 sm:py-8 px-4 sm:px-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:grid-cols-none sm:flex gap-2">
              <TabsTrigger value="shows" className="flex items-center gap-2">
                <CalendarPlus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('translation.show.showDetails')}</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t('translation.admin.manageUsers')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="reservations"
                className="flex items-center gap-2"
              >
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">{t('translation.admin.manageReservations')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="shows" className="space-y-6">
            {/* Add Show Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarPlus className="h-5 w-5" />
                  {t('translation.admin.addShow')}
                </CardTitle>
                <CardDescription>
                  Create a new movie show with custom settings and seat configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShowForm />
              </CardContent>
            </Card>

            {/* Manage Shows Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {t('translation.admin.manageShows')}
                </CardTitle>
                <CardDescription>
                  View, edit, and manage all your movie shows and bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShowList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t('translation.admin.manageUsers')}</CardTitle>
                <CardDescription>
                  {t('translation.admin.manageUsers')} {t('translation.common.andTheir')} {t('translation.admin.permissions')}
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
      <Footer />
    </div>
  );
}
