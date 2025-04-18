import { useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { Shield, CalendarPlus, Users, Ticket } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AdminLayoutProps = {
  children: {
    showsContent: ReactNode;
    usersContent: ReactNode;
    reservationsContent: ReactNode;
  };
  title?: string;
};

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("shows");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4 sm:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{title || t('translation.admin.adminPanel')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
            >
              {t('translation.admin.backToHome')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 sm:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:grid-cols-none md:flex gap-2">
            <TabsTrigger value="shows" className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              <span className="hidden md:inline">{t('translation.show.shows')}</span>
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              <span className="hidden md:inline">{t('translation.admin.reservations')}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline">{t('translation.admin.users')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shows" className="space-y-6">
            {children.showsContent}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-6">
            {children.reservationsContent}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {children.usersContent}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}