import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AuthFooter() {
  const { t } = useTranslation();
  
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-background/80 dark:bg-gray-800/30 py-3 text-center text-xs text-muted-foreground border-t border-border/30 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-10 w-full">
      <div className="container flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>{t("translation.common.appName")} &copy; {currentYear}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center">
          <span>{t("translation.common.militaryVenue")}</span>
          <span className="hidden sm:inline">•</span>
          <span>support@militaryreservation.gov • +1 (555) 123-4567</span>
        </div>
      </div>
    </footer>
  );
}