import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { User, insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Shield, Trash2, Edit, UserPlus, Lock, Power } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";

// Optimize with React.memo to prevent unnecessary re-renders
const CreateUserDialog = React.memo(() => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
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
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          {t('translation.admin.createNewUser')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('translation.admin.createNewUser')}</DialogTitle>
          <DialogDescription>
            {t('translation.admin.createNewUserDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createUserMutation.mutate(data))}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('translation.common.username')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('translation.admin.enterUsername')}
                      {...field} 
                    />
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
                  <FormLabel>{t('translation.common.password')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={t('translation.admin.enterPassword')}
                      {...field} 
                    />
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
                  <FormLabel>{t('translation.admin.seatLimit')}</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={20} 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('translation.admin.seatLimitDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isAdmin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>{t('translation.admin.adminPrivileges')}</FormLabel>
                    <FormDescription>
                      {t('translation.admin.adminPrivilegesDescription')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                {t('translation.common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('translation.common.creating')}
                  </div>
                ) : (
                  t('translation.common.create')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

// EditUserDialog component
function EditUserDialog({ user, open, onClose }: { user: User; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const form = useForm({
    resolver: zodResolver(insertUserSchema.omit({ password: true })),
    defaultValues: {
      username: user.username,
      isAdmin: user.isAdmin,
      isEnabled: user.isEnabled,
      seatLimit: user.seatLimit || 4,
    },
  });

  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const updateUserMutation = useMutation({
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

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      setResetPasswordOpen(false);
      setNewPassword("");
      toast({
        title: "Success",
        description: "Password reset successfully",
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

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('translation.admin.editUser')}</DialogTitle>
            <DialogDescription>
              {t('translation.admin.editUserDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => updateUserMutation.mutate(data))}
              className="space-y-4 pt-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('translation.common.username')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <FormLabel>{t('translation.admin.seatLimit')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={20} 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('translation.admin.adminPrivileges')}</FormLabel>
                      <FormDescription>
                        {t('translation.admin.adminPrivilegesDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('translation.admin.accountEnabled')}</FormLabel>
                      <FormDescription>
                        {t('translation.admin.accountEnabledDescription')}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setResetPasswordOpen(true)}
                >
                  <Lock className="h-4 w-4" />
                  {t('translation.admin.resetPassword')}
                </Button>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                  >
                    {t('translation.common.cancel')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {t('translation.common.updating')}
                      </div>
                    ) : (
                      t('translation.common.save')
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('translation.admin.resetUserPassword')}</DialogTitle>
            <DialogDescription>
              {t('translation.admin.resetUserPasswordFor')} <strong>{user.username}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                {t('translation.admin.newPassword')}
              </label>
              <Input
                id="newPassword"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('translation.admin.enterNewPassword')}
              />
              <p className="text-sm text-muted-foreground">
                {t('translation.admin.passwordSecurityNote')}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setResetPasswordOpen(false)}
              >
                {t('translation.common.cancel')}
              </Button>
              <Button 
                variant="destructive"
                disabled={!newPassword || resetPasswordMutation.isPending}
                onClick={() => resetPasswordMutation.mutate()}
              >
                {resetPasswordMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('translation.admin.resetting')}
                  </div>
                ) : (
                  t('translation.admin.resetPassword')
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Main UserManagement component
export function UserManagement() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
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

  const toggleUserAdminMutation = useMutation({
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
        description: "User admin status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user admin status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const columns = [
    {
      header: t('translation.common.user'),
      accessorKey: (user: User) => (
        <div className="flex items-center gap-2">
          <UserAvatar user={user} />
          <div className="flex flex-col">
            <span className="font-medium">{user.username}</span>
            <div className="flex gap-1">
              {user.isAdmin && (
                <Badge variant="outline" className="bg-primary/10 text-xs">
                  {t('translation.common.admin')}
                </Badge>
              )}
              {!user.isEnabled && (
                <Badge variant="outline" className="bg-destructive/10 text-xs text-destructive">
                  {t('translation.admin.disabled')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: t('translation.admin.seatLimit'),
      accessorKey: (user: User) => user.seatLimit || 4,
    },
    {
      header: t('translation.admin.status'),
      accessorKey: (user: User) => (
        <div className="flex items-center justify-end">
          <Switch
            checked={user.isEnabled}
            onCheckedChange={(isEnabled) => {
              toggleUserStatusMutation.mutate({ userId: user.id, isEnabled });
            }}
          />
        </div>
      ),
    },
    {
      header: t('translation.admin.actions'),
      accessorKey: (user: User) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setEditingUser(user)}
            title={t('translation.common.edit')}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              toggleUserAdminMutation.mutate({
                userId: user.id,
                isAdmin: !user.isAdmin,
              });
            }}
            title={user.isAdmin ? t('translation.admin.removeAdmin') : t('translation.admin.makeAdmin')}
          >
            <Shield className={`h-4 w-4 ${user.isAdmin ? "text-primary" : "text-muted-foreground"}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              toggleUserStatusMutation.mutate({
                userId: user.id,
                isEnabled: !user.isEnabled,
              });
            }}
            title={user.isEnabled ? t('translation.admin.disableUser') : t('translation.admin.enableUser')}
          >
            <Power className={`h-4 w-4 ${!user.isEnabled ? "text-destructive" : "text-muted-foreground"}`} />
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
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateUserDialog />
      </div>
      
      <DataTable
        data={users}
        columns={columns}
        searchable
        searchKeys={["username"]}
      />

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}