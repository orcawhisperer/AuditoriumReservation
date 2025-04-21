import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Shield, Menu, X, Home, User, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter
} from "@/components/ui/drawer";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export function MobileNavDrawer() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const handleNavigation = (path: string) => {
    setLocation(path);
  };
  
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85%] px-4">
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <DrawerTitle>
                {t("translation.common.appName")}
              </DrawerTitle>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="space-y-4 py-4">
          <h3 className="text-sm font-medium text-muted-foreground px-1">
            {t("translation.common.quickLinks")}
          </h3>
          
          <div className="grid gap-2">
            <Button 
              variant="ghost" 
              className="justify-start gap-2 w-full"
              onClick={() => handleNavigation("/")}
            >
              <Home className="h-4 w-4" />
              {t("translation.common.home")}
            </Button>
            
            <Button 
              variant="ghost" 
              className="justify-start gap-2 w-full"
              onClick={() => handleNavigation("/profile")}
            >
              <User className="h-4 w-4" />
              {t("translation.common.profile")}
            </Button>
            
            <Button 
              variant="ghost" 
              className="justify-start gap-2 w-full"
              onClick={() => handleNavigation("/about")}
            >
              <InfoIcon className="h-4 w-4" />
              {t("translation.common.about")} / {t("translation.common.contact")}
            </Button>
            
            {user?.isAdmin && (
              <Button 
                variant="ghost" 
                className="justify-start gap-2 w-full"
                onClick={() => handleNavigation("/admin")}
              >
                <Shield className="h-4 w-4" />
                {t("translation.admin.dashboard")}
              </Button>
            )}
          </div>
        </div>
        
        <DrawerFooter className="flex-row justify-between pt-2 pb-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}