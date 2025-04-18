import { useEffect } from "react";
import { useLocation, useNavigate } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { UserManagement } from "@/components/admin/UserManagement";
import { ShowManagement } from "@/components/admin/ShowManagement";
import { ReservationManagement } from "@/components/admin/ReservationManagement";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useTranslation } from "react-i18next";

export default function AdminPageNew() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  
  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && user && !user.isAdmin) {
      navigate("/");
    }
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);
  
  // Don't render anything while checking auth status
  if (isLoading || !user) {
    return null;
  }
  
  return (
    <AdminLayout title={t('translation.admin.adminPanel')}>
      <div className="space-y-6">
        <ShowManagement />
        
        <ReservationManagement />
        
        <UserManagement />
      </div>
    </AdminLayout>
  );
}