import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown, Check } from "lucide-react";
import { Show } from "@shared/schema";

export function ShowFilterSelect({ selectedShowId, onSelectShow, shows }: { selectedShowId: string; onSelectShow: (showId: string) => void; shows: Show[]; }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredShows = useMemo(() => {
    if (!searchQuery.trim()) {
      return shows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 50);
    }
    return shows
      .filter((show) => show.title.toLowerCase().includes(searchQuery.toLowerCase()) || show.emoji?.includes(searchQuery) || format(new Date(show.date), "MMM dd, yyyy").toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [shows, searchQuery]);

  const selectedShow = shows.find((show) => show.id.toString() === selectedShowId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedShowId === "all" ? (
            "All Shows"
          ) : selectedShow ? (
            <div className="flex items-center gap-2 truncate">
              <span>{selectedShow.emoji}</span>
              <span className="truncate">{selectedShow.title}</span>
            </div>
          ) : (
            "Filter by show"
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search shows..." value={searchQuery} onValueChange={setSearchQuery} />
          <CommandList>
            <CommandEmpty>{searchQuery ? "No shows found matching your search" : "No shows available"}</CommandEmpty>
            <CommandGroup>
              <CommandItem key="all" value="all" onSelect={() => { onSelectShow("all"); setOpen(false); setSearchQuery(""); }}>
                <Check className={`mr-2 h-4 w-4 ${selectedShowId === "all" ? "opacity-100" : "opacity-0"}`} />
                All Shows
              </CommandItem>
              {filteredShows.map((show) => (
                <CommandItem key={show.id} value={`${show.title} ${show.emoji} ${format(new Date(show.date), "MMM dd, yyyy")}`} onSelect={() => { onSelectShow(show.id.toString()); setOpen(false); setSearchQuery(""); }}>
                  <Check className={`mr-2 h-4 w-4 ${selectedShowId === show.id.toString() ? "opacity-100" : "opacity-0"}`} />
                  <div className="flex items-center gap-2 w-full">
                    <span>{show.emoji}</span>
                    <span className="truncate">{show.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{format(new Date(show.date), "MMM dd")}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {!searchQuery && shows.length > 50 && (
              <div className="p-2 text-xs text-muted-foreground text-center border-t">Showing recent 50 shows. Use search to find older shows.</div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
