import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { AdminLayout, AdminTabs } from "@/components/admin/AdminLayout";
import { ShowManagement } from "@/components/admin/ShowManagement";
import { UserManagement } from "@/components/admin/UserManagement";
import { ReservationManagement } from "@/components/admin/ReservationManagement";
import { CalendarPlus, Users, Ticket } from "lucide-react";

export default function AdminPageNew() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("shows");

  if (!user || !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-xl font-semibold mb-2">
          {t('translation.admin.adminAccessRequired')}
        </div>
        <div className="text-muted-foreground">
          {t('translation.admin.youNeedAdminPermissions')}
        </div>
      </div>
    );
  }

  // Render the appropriate content based on the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "shows":
        return <ShowManagement />;
      case "users":
        return <UserManagement />;
      case "reservations":
        return <ReservationManagement />;
      default:
        return <ShowManagement />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <AdminTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderTabContent()}
      </AdminTabs>
    </AdminLayout>
  );
}