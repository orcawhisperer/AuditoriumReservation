import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Show, insertShowSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export function EditShowDialog({ show, onClose }: { show: Show; onClose: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>(show.poster || "");
  const [foodMenuPreview, setFoodMenuPreview] = useState<string>(show.foodMenu || "");
  const isPastShow = new Date(show.date) < new Date();

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
        : typeof show.blockedSeats === "string"
        ? show.blockedSeats.includes("[")
          ? JSON.parse(show.blockedSeats).join(",")
          : show.blockedSeats
        : "",
      allowedCategories: Array.isArray(show.allowedCategories)
        ? show.allowedCategories
        : typeof show.allowedCategories === "string" && show.allowedCategories.length > 0
        ? show.allowedCategories.startsWith("[")
          ? JSON.parse(show.allowedCategories)
          : ["single", "family", "fafa"]
        : ["single", "family", "fafa"],
      fafaExclusiveRows: Array.isArray(show.fafaExclusiveRows)
        ? show.fafaExclusiveRows.join(",")
        : typeof show.fafaExclusiveRows === "string" && show.fafaExclusiveRows.length > 0
        ? show.fafaExclusiveRows.startsWith("[")
          ? JSON.parse(show.fafaExclusiveRows).join(",")
          : show.fafaExclusiveRows
        : "",
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Show</DialogTitle>
          <DialogDescription>Update show details and media.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => editShowMutation.mutate(data))} className="space-y-4">
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

            <FormField
              control={form.control}
              name="poster"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poster Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input type="file" accept="image/*" onChange={handlePosterChange} />
                      {previewUrl && (
                        <div className="relative w-full max-w-lg overflow-hidden rounded-lg border">
                          <div className="relative aspect-video">
                            <img src={previewUrl} alt="Poster preview" className="absolute inset-0 w-full h-full object-cover" />
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
                      <Input type="file" accept="image/*" onChange={handleFoodMenuChangeEdit} />
                      {foodMenuPreview && (
                        <div className="relative w-full max-w-lg overflow-hidden rounded-lg border">
                          <div className="relative aspect-video">
                            <img src={foodMenuPreview} alt="Food menu preview" className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                        </div>
                      )}
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
                {editShowMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Show
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
