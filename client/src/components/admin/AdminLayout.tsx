import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShowManagement } from "./ShowManagement";
import { UserManagement } from "./UserManagement";
import { ReservationManagement } from "./ReservationManagement";

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{t('translation.common.appName')} {t('translation.common.admin')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="w-full sm:w-auto"
            >
              {t('translation.admin.backToHome')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-4 sm:py-8 px-4 sm:px-8">
        {children}
      </main>
    </div>
  );
}

export function AdminTabs({ 
  activeTab, 
  onTabChange,
  children 
}: {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:grid-cols-none sm:flex gap-2">
          <TabsTrigger value="shows" className="flex items-center gap-2">
            <span className="hidden sm:inline">{t('translation.show.showDetails')}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <span className="hidden sm:inline">{t('translation.admin.manageUsers')}</span>
          </TabsTrigger>
          <TabsTrigger value="reservations" className="flex items-center gap-2">
            <span className="hidden sm:inline">{t('translation.admin.manageReservations')}</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="shows" className="space-y-4">
        <ShowManagement />
      </TabsContent>

      <TabsContent value="users">
        <UserManagement />
      </TabsContent>

      <TabsContent value="reservations">
        <ReservationManagement />
      </TabsContent>
    </Tabs>
  );
}