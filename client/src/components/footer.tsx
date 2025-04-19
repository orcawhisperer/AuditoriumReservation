import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background/80 dark:bg-gray-800/90 py-4 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-10 w-full">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Logo and basic information */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm">{t("translation.common.appName")}</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("translation.common.militaryVenue")}
            </p>
          </div>
          
          {/* Quick links */}
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-xs mb-1">{t("translation.common.quickLinks")}</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setLocation("/")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("translation.common.home")}
              </button>
              <button 
                onClick={() => setLocation("/about")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("translation.common.about")}
              </button>
              <button 
                onClick={() => setLocation("/profile")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("translation.common.profile")}
              </button>
            </div>
          </div>
          
          {/* Contact information - simplified */}
          <div className="text-right">
            <h3 className="font-semibold text-xs mb-1">{t("translation.common.contactUs")}</h3>
            <p className="text-xs text-muted-foreground">support@militaryreservation.gov • +1 (555) 123-4567</p>
          </div>
        </div>
        
        <div className="border-t border-border/40 mt-2 pt-2 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {t("translation.common.appName")}. {t("translation.common.allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}