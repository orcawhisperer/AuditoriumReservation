import React, { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { Show, insertShowSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Search, CalendarPlus, Trash2, Edit, Eye } from "lucide-react";
import { DataTable } from "./DataTable";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { SeatGrid } from "@/components/seat-grid-new";

// Optimize with React.memo to prevent unnecessary re-renders
const ShowForm = React.memo(() => {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isTemplateSelectOpen, setIsTemplateSelectOpen] = useState<boolean>(false);
  const { t } = useTranslation();

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
  
  // Function to load template data from an existing show
  const loadTemplateData = useCallback((templateShow: Show) => {
    form.setValue("title", templateShow.title);
    form.setValue("description", templateShow.description || "");
    form.setValue("themeColor", templateShow.themeColor || "#4B5320");
    form.setValue("emoji", templateShow.emoji || "🎭");
    form.setValue("blockedSeats", templateShow.blockedSeats || "");
    
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
  }, [form, toast]);

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
      <div className="mb-4">
        <Dialog open={isTemplateSelectOpen} onOpenChange={setIsTemplateSelectOpen}>
          <DialogTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center gap-2"
            >
              <CalendarPlus className="h-4 w-4" />
              {t('translation.admin.useExistingTemplate')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{t('translation.admin.chooseTemplate')}</DialogTitle>
              <DialogDescription>
                {t('translation.admin.selectExistingDescription')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('translation.admin.searchShows')}
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
                          {show.description || t('translation.common.noDescription')}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-50" />
                    <p>{t('translation.admin.noShowsFound')}</p>
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
              <FormLabel>{t('translation.common.title')}</FormLabel>
              <FormControl>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder={t('translation.admin.enterShowTitle')}
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
                            "🎭", "🎪", "🎫", "🎬", "🎸", "🎹", "🎺", "🎻",
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
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('translation.common.date')}</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('translation.common.description')}</FormLabel>
              <FormControl>
                <textarea
                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={t('translation.admin.enterDescription')}
                  {...field}
                />
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
              <FormLabel>{t('translation.admin.themeColor')}</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input type="color" {...field} className="w-12 h-8 p-1" />
                  <span className="text-sm text-muted-foreground">
                    {field.value}
                  </span>
                </div>
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
              <FormLabel>{t('translation.admin.poster')}</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    className="cursor-pointer"
                  />
                  {previewUrl && (
                    <div className="relative aspect-video w-full max-w-md mx-auto overflow-hidden rounded-md border border-border">
                      <img
                        src={previewUrl}
                        alt="Poster preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                {t('translation.admin.posterDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="blockedSeats"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('translation.admin.blockedSeats')}</FormLabel>
              <FormControl>
                <Input
                  placeholder="A1, B5, C12"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t('translation.admin.blockedSeatsDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={createShowMutation.isPending}
        >
          {createShowMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t('translation.common.creating')}
            </div>
          ) : (
            t('translation.admin.createShow')
          )}
        </Button>
      </form>
    </Form>
  );
});

// EditShowDialog component
function EditShowDialog({ show, open, onClose }: { show: Show; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string>(show.poster || "");
  
  const form = useForm({
    resolver: zodResolver(insertShowSchema),
    defaultValues: {
      title: show.title,
      date: new Date(show.date).toISOString().slice(0, 16),
      poster: show.poster || "",
      description: show.description || "",
      themeColor: show.themeColor || "#4B5320",
      emoji: show.emoji || "🎭",
      blockedSeats: show.blockedSeats || "",
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

  const updateShowMutation = useMutation({
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('translation.admin.editShow')}</DialogTitle>
          <DialogDescription>
            {t('translation.admin.editShowDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => updateShowMutation.mutate(data))}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('translation.common.title')}</FormLabel>
                  <FormControl>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input {...field} className="flex-1" />
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
                                "🎭", "🎪", "🎫", "🎬", "🎸", "🎹", "🎺", "🎻",
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('translation.common.date')}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('translation.common.description')}</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
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
                  <FormLabel>{t('translation.admin.themeColor')}</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" {...field} className="w-12 h-8 p-1" />
                      <span className="text-sm text-muted-foreground">
                        {field.value}
                      </span>
                    </div>
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
                  <FormLabel>{t('translation.admin.poster')}</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePosterChange}
                      />
                      {previewUrl && (
                        <div className="relative aspect-video w-full max-w-md mx-auto overflow-hidden rounded-md border border-border">
                          <img
                            src={previewUrl}
                            alt="Poster preview"
                            className="h-full w-full object-cover"
                          />
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
              name="blockedSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('translation.admin.blockedSeats')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    {t('translation.admin.blockedSeatsDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
              >
                {t('translation.common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={updateShowMutation.isPending}
              >
                {updateShowMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('translation.common.updating')}
                  </div>
                ) : (
                  t('translation.common.save')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ShowPreviewDialog component
function ShowPreviewDialog({ show, open, onClose }: { show: Show; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {show.emoji} {show.title}
          </DialogTitle>
          <DialogDescription>
            {format(new Date(show.date), "PPP")} at {format(new Date(show.date), "p")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {show.poster && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={show.poster}
                alt={show.title}
                className="h-full w-full object-contain"
              />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium">{t('translation.common.description')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {show.description || t('translation.common.noDescription')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">{t('translation.admin.seatLayout')}</h3>
            <div className="mt-2 p-2 rounded border">
              <SeatGrid
                showId={show.id.toString()}
                hideActionButtons={true}
                isAdminMode={true}
                className="max-h-[400px] overflow-y-auto"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ShowList component
function ShowList() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [previewShow, setPreviewShow] = useState<Show | null>(null);
  const [showToDelete, setShowToDelete] = useState<Show | null>(null);

  const { data: shows = [], isLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  const deleteShowMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/shows/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      setShowToDelete(null);
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

  const calculateTotalSeats = (show: Show) => {
    try {
      const layout = typeof show.seatLayout === 'string' 
        ? JSON.parse(show.seatLayout) 
        : show.seatLayout;
      
      let totalCount = 0;
      for (const section of Object.values(layout)) {
        for (const row of Object.values(section as any)) {
          totalCount += (row as any).length || 0;
        }
      }
      return totalCount;
    } catch (e) {
      console.error("Error calculating seats:", e);
      return 0;
    }
  };

  const columns = [
    {
      header: t('translation.common.title'),
      accessorKey: (show: Show) => (
        <div className="flex items-center gap-2">
          <span>{show.emoji || "🎭"}</span>
          <span className="font-medium">{show.title}</span>
        </div>
      ),
    },
    {
      header: t('translation.common.date'),
      accessorKey: (show: Show) => format(new Date(show.date), "PPP p"),
    },
    {
      header: t('translation.admin.totalSeats'),
      accessorKey: (show: Show) => calculateTotalSeats(show),
    },
    {
      header: t('translation.admin.actions'),
      accessorKey: (show: Show) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPreviewShow(show)}
            title={t('translation.admin.preview')}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setEditingShow(show)}
            title={t('translation.common.edit')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowToDelete(show)}
            title={t('translation.common.delete')}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <DataTable
        data={shows}
        columns={columns}
        searchable
        searchKeys={["title", "description"]}
      />

      {editingShow && (
        <EditShowDialog
          show={editingShow}
          open={!!editingShow}
          onClose={() => setEditingShow(null)}
        />
      )}

      {previewShow && (
        <ShowPreviewDialog
          show={previewShow}
          open={!!previewShow}
          onClose={() => setPreviewShow(null)}
        />
      )}

      <AlertDialog open={!!showToDelete} onOpenChange={(isOpen) => !isOpen && setShowToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('translation.admin.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('translation.admin.deleteShowWarning')} 
              <strong>{showToDelete?.title}</strong>?
              {t('translation.admin.deleteShowWarning2')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('translation.common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showToDelete && deleteShowMutation.mutate(showToDelete.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteShowMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t('translation.common.deleting')}
                </div>
              ) : (
                t('translation.common.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Main ShowManagement component
export function ShowManagement() {
  const { t } = useTranslation();
  
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('translation.admin.addShow')}</CardTitle>
          <CardDescription>
            {t('translation.admin.addShowDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShowForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('translation.admin.manageShows')}</CardTitle>
          <CardDescription>
            {t('translation.admin.manageShowsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[600px] overflow-y-auto pr-2">
          <ShowList />
        </CardContent>
      </Card>
    </div>
  );
}