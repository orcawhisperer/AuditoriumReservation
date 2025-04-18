import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { User, insertUserSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Users, Key, UserPlus, UserCheck, UserX, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { DataTable } from "./DataTable";
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

const CreateUserDialog = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
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
        <Button variant="outline" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          {t('translation.admin.createUser')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('translation.admin.addUser')}</DialogTitle>
          <DialogDescription>
            {t('translation.admin.addUserDescription')}
          </DialogDescription>
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
                  <FormLabel>{t('translation.common.username')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('translation.auth.usernamePlaceholder')}
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
                      placeholder={t('translation.auth.passwordPlaceholder')}
                      {...field}
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t('translation.admin.adminPrivileges')}
                    </FormLabel>
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t('translation.admin.enabledAccount')}
                    </FormLabel>
                    <FormDescription>
                      {t('translation.admin.enabledAccountDescription')}
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
                  t('translation.admin.createUser')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const ResetPasswordDialog = ({ user, open, onClose }: { user: User; open: boolean; onClose: () => void }) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const form = useForm({
    resolver: zodResolver(
      insertUserSchema.pick({ password: true })
    ),
    defaultValues: {
      password: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { password: string }) => {
      const res = await fetch(`/api/users/${user.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      form.reset();
      onClose();
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('translation.admin.resetPassword')}</DialogTitle>
          <DialogDescription>
            {t('translation.admin.resetPasswordFor')} {user.username}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => resetPasswordMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('translation.common.newPassword')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t('translation.auth.passwordPlaceholder')}
                      {...field}
                    />
                  </FormControl>
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
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t('translation.common.resetting')}
                  </div>
                ) : (
                  t('translation.admin.resetPassword')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export function UserManagement() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Fetch users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Toggle user status (enabled/disabled)
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isEnabled }: { userId: number; isEnabled: boolean }) => {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
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

  // Toggle admin status
  const toggleAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) => {
      const res = await fetch(`/api/users/${userId}/admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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
    },
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setUserToDelete(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const columns = [
    {
      header: t('translation.common.username'),
      accessorKey: "username",
    },
    {
      header: t('translation.admin.status'),
      accessorKey: "isEnabled",
      cell: (row: User) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleUserStatusMutation.mutate({
            userId: row.id,
            isEnabled: !row.isEnabled,
          })}
          className={row.isEnabled ? "text-green-500" : "text-red-500"}
        >
          {row.isEnabled ? (
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{t('translation.admin.enabled')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              <span className="hidden sm:inline">{t('translation.admin.disabled')}</span>
            </div>
          )}
        </Button>
      ),
    },
    {
      header: t('translation.admin.role'),
      accessorKey: "isAdmin",
      cell: (row: User) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleAdminStatusMutation.mutate({
            userId: row.id,
            isAdmin: !row.isAdmin,
          })}
          className={row.isAdmin ? "text-blue-500" : "text-gray-500"}
        >
          {row.isAdmin ? (
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{t('translation.admin.adminUser')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShieldX className="h-4 w-4" />
              <span className="hidden sm:inline">{t('translation.admin.regularUser')}</span>
            </div>
          )}
        </Button>
      ),
    },
    {
      header: t('translation.admin.actions'),
      accessorKey: "actions",
      cell: (row: User) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setResetPasswordUser(row)}
            title={t('translation.admin.resetPassword')}
          >
            <Key className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setUserToDelete(row)}
            title={t('translation.admin.deleteUser')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('translation.admin.manageUsers')}
          </CardTitle>
          <CardDescription>
            {t('translation.admin.manageUsersDescription')}
          </CardDescription>
        </div>
        <CreateUserDialog />
      </CardHeader>
      <CardContent>
        <DataTable
          data={users}
          columns={columns}
          searchable
          searchKeys={["username"]}
        />

        {/* Reset Password Dialog */}
        {resetPasswordUser && (
          <ResetPasswordDialog
            user={resetPasswordUser}
            open={!!resetPasswordUser}
            onClose={() => setResetPasswordUser(null)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog 
          open={!!userToDelete} 
          onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('translation.admin.confirmDelete')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('translation.admin.deleteUserWarning')} 
                <strong>{userToDelete?.username}</strong>?
                {t('translation.admin.deleteUserWarningDetail')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('translation.common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                {deleteUserMutation.isPending ? (
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
      </CardContent>
    </Card>
  );
}