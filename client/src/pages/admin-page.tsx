import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/footer";
import { Shield, CalendarPlus, Users, Ticket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShowForm, ShowList, UserManagement, ReservationManagement } from "@/components/admin";

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("shows");
  const { t } = useTranslation();

  if (!user?.isAdmin) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b bg-background dark:bg-gray-800">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-4 sm:py-0 px-4 sm:px-8">
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">{t('translation.common.appName')} {t('translation.common.admin')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setLocation("/")} className="w-full sm:w-auto">
              {t('translation.admin.backToHome')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-4 sm:py-8 px-4 sm:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:grid-cols-none sm:flex gap-2">
              <TabsTrigger value="shows" className="flex items-center gap-2">
                <CalendarPlus className="h-4 w-4" />
                <span className="hidden sm:inline">{t('translation.show.showDetails')}</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t('translation.admin.manageUsers')}</span>
              </TabsTrigger>
              <TabsTrigger value="reservations" className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                <span className="hidden sm:inline">{t('translation.admin.manageReservations')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="shows" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarPlus className="h-5 w-5" />
                  {t('translation.admin.addShow')}
                </CardTitle>
                <CardDescription>
                  Create a new movie show with custom settings and seat configuration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShowForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {t('translation.admin.manageShows')}
                </CardTitle>
                <CardDescription>
                  View, edit, and manage all your movie shows and bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShowList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t('translation.admin.manageUsers')}</CardTitle>
                <CardDescription>
                  {t('translation.admin.manageUsers')} {t('translation.common.andTheir')} {t('translation.admin.permissions')}
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto pr-4">
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reservations">
            <ReservationManagement />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
