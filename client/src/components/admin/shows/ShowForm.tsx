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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Show, insertShowSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Loader2, Search, CalendarPlus, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";

export function ShowForm() {
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
