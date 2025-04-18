import React from "react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ShowManagement } from "@/components/admin/ShowManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { ReservationManagement } from "@/components/admin/ReservationManagement";

export default function AdminPage() {
  const { t } = useTranslation();

  return (
    <AdminLayout
      title={t('translation.admin.adminPanel')}
      children={{
        showsContent: <ShowManagement />,
        usersContent: <UserManagement />,
        reservationsContent: <ReservationManagement />
      }}
    />
  );
}