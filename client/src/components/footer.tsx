import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background dark:bg-gray-800 py-6 mt-12">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and basic information */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="font-bold text-lg">{t("translation.common.appName")}</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("translation.common.reservationSystem")} {currentYear}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {t("translation.common.militaryVenue")}
            </p>
          </div>
          
          {/* Quick links */}
          <div>
            <h3 className="font-semibold mb-3">{t("translation.common.quickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => setLocation("/")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("translation.common.home")}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/about")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("translation.common.about")}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setLocation("/profile")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("translation.common.profile")}
                </button>
              </li>
            </ul>
          </div>
          
          {/* Contact information */}
          <div>
            <h3 className="font-semibold mb-3">{t("translation.common.contactUs")}</h3>
            <address className="not-italic text-sm text-muted-foreground">
              <p>Shahbaaz Auditorium</p>
              <p>Military Command Center</p>
              <p>support@militaryreservation.gov</p>
              <p>+1 (555) 123-4567</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-border/40 mt-6 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} {t("translation.common.appName")}. {t("translation.common.allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}