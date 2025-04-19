import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AuthFooter() {
  const { t } = useTranslation();
  
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-background dark:bg-gray-800/30 py-3 text-center text-sm text-muted-foreground mt-auto border-t border-border/30 backdrop-blur-sm">
      <div className="container flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>{t("translation.common.appName")} &copy; {currentYear}</span>
        </div>
        <div>
          {t("translation.common.militaryVenue")}
        </div>
      </div>
    </footer>
  );
}