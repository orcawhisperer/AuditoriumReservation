import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FooterProps {
  variant?: 'full' | 'simple';
}

export function Footer({ variant = 'full' }: FooterProps) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-background/80 dark:bg-gray-800/90 py-2 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-10 w-full">
      <div className="container mx-auto px-4 sm:px-8">
        {variant === 'simple' ? (
          // Simple footer variant - streamlined for both mobile and desktop
          <div className="flex flex-row justify-between items-center h-8">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-primary" />
              <span className="text-xs">{t("translation.common.appName")} &copy; {currentYear}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setLocation("/about")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("translation.common.about")}
              </button>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                support@militaryreservation.gov
              </span>
            </div>
          </div>
        ) : (
          // Full footer variant - more compact with optimized layout
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 py-1">
            {/* Left column */}
            <div className="flex items-center">
              <Shield className="h-3.5 w-3.5 text-primary mr-1.5" />
              <div>
                <span className="text-xs font-medium">{t("translation.common.appName")}</span>
                <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
                  • {t("translation.common.militaryVenue")}
                </span>
              </div>
            </div>
            
            {/* Middle column - quick links */}
            <div className="flex justify-end sm:justify-center items-center space-x-4">
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
                className="hidden sm:block text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("translation.common.profile")}
              </button>
            </div>
            
            {/* Right column - copyright */}
            <div className="hidden sm:flex justify-end items-center">
              <span className="text-xs text-muted-foreground">
                &copy; {currentYear} {t("translation.common.allRightsReserved")}
              </span>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}