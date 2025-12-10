import { useState } from "react";
import { User } from "@shared/schema";
import { CreateUserDialog } from "./CreateUserDialog";
import { UserList } from "./UserList";

export function UserManagement() {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
      <CreateUserDialog />
      <UserList />
    </div>
  );
}
