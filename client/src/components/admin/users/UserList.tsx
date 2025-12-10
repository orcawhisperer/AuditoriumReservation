import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Loader2, Users, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditUserDialog } from "./EditUserDialog";

export function UserList() {
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [resetPasswordResult, setResetPasswordResult] = useState<{ password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: users = [], isLoading } = useQuery<User[]>({ queryKey: ["/api/users"], staleTime: 1000 });
  const { user: currentUser } = useAuth();
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);

  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const isPrimaryAdmin = currentUser?.id === users.find((u) => u.isAdmin)?.id;

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/users/${userId}/reset-password`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setResetPasswordResult({ password: data.temporaryPassword });
      setCopied(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to reset password", description: error.message, variant: "destructive" });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isEnabled }: { userId: number; isEnabled: boolean }) => {
      const res = await fetch(`/api/users/${userId}/toggle-status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isEnabled }) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Success", description: "User status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update user status", description: error.message, variant: "destructive" });
    },
  });

  const toggleAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const res = await fetch(`/api/users/${userId}/toggle-admin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAdmin }) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData<User[]>(["/api/users"], (oldUsers) => {
        if (!oldUsers) return [data];
        return oldUsers.map((user) => (user.id === data.id ? data : user));
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Success", description: "User admin status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update admin status", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Search users" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      <div className="space-y-3">
        {paginatedUsers.map((user) => (
          <div key={user.id} className="p-4 border rounded-lg flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">{user.name || user.username}</div>
              <div className="text-sm text-muted-foreground">{user.username} • {user.category} • limit {user.seatLimit}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => resetPasswordMutation.mutate(user.id)} disabled={!isPrimaryAdmin}>
                Reset Password
              </Button>
              <Button size="sm" variant="outline" onClick={() => toggleUserStatusMutation.mutate({ userId: user.id, isEnabled: !user.isEnabled })}>
                {user.isEnabled ? "Disable" : "Enable"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => toggleAdminStatusMutation.mutate({ userId: user.id, isAdmin: !user.isAdmin })}>
                {user.isAdmin ? "Remove Admin" : "Make Admin"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          <Users className="h-8 w-8 mb-2" />
          <p>No users found</p>
        </div>
      )}

      {filteredUsers.length > itemsPerPage && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink onClick={() => setPage(pageNum)} isActive={page === pageNum}>
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {editingUser && <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />}

      {/* Password Reset Result Dialog */}
      <Dialog open={!!resetPasswordResult} onOpenChange={(open) => !open && setResetPasswordResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Password Reset Successful</DialogTitle>
            <DialogDescription>
              The user's password has been reset. Please share the temporary password with them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Temporary password:</p>
              <div className="flex gap-2">
                <Input value={resetPasswordResult?.password || ""} readOnly className="font-mono bg-muted" onClick={(e) => (e.target as HTMLInputElement).select()} />
                <Button variant="outline" onClick={() => {
                  if (resetPasswordResult?.password) {
                    navigator.clipboard.writeText(resetPasswordResult.password);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Please share this password with the user securely.</p>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setResetPasswordResult(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
