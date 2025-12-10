import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown, Check } from "lucide-react";
import { User } from "@shared/schema";

export function UserFilterSelect({ selectedUserId, onSelectUser, users }: { selectedUserId: string; onSelectUser: (userId: string) => void; users: User[]; }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users.sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username)).slice(0, 50);
    }

    return users
      .filter((user) => (user.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || user.username.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username))
      .slice(0, 20);
  }, [users, searchQuery]);

  const selectedUser = users.find((user) => user.id.toString() === selectedUserId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedUserId === "all" ? (
            "All Users"
          ) : selectedUser ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{selectedUser.name || selectedUser.username}</span>
              {selectedUser.isAdmin && <span className="text-xs text-blue-600">(Admin)</span>}
            </div>
          ) : (
            "Filter by user"
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users..." value={searchQuery} onValueChange={setSearchQuery} />
          <CommandList>
            <CommandEmpty>{searchQuery ? "No users found matching your search" : "No users available"}</CommandEmpty>
            <CommandGroup>
              <CommandItem key="all" value="all" onSelect={() => { onSelectUser("all"); setOpen(false); setSearchQuery(""); }}>
                <Check className={`mr-2 h-4 w-4 ${selectedUserId === "all" ? "opacity-100" : "opacity-0"}`} />
                All Users
              </CommandItem>
              {filteredUsers.map((user) => (
                <CommandItem key={user.id} value={`${user.name || user.username} ${user.username}`} onSelect={() => { onSelectUser(user.id.toString()); setOpen(false); setSearchQuery(""); }}>
                  <Check className={`mr-2 h-4 w-4 ${selectedUserId === user.id.toString() ? "opacity-100" : "opacity-0"}`} />
                  <div className="flex items-center gap-2 w-full">
                    <span className="truncate">{user.name || user.username}</span>
                    {user.isAdmin && <span className="text-xs text-blue-600 ml-auto">(Admin)</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {!searchQuery && users.length > 50 && (
              <div className="p-2 text-xs text-muted-foreground text-center border-t">Showing first 50 users. Use search to find specific users.</div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
