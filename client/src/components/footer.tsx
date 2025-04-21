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
  const phoneNumber = "+1 (555) 123-4567";
  const email = "support@militaryreservation.gov";
  const venueInfo = "Military Command Center Venue";
  
  const SimpleFooter = () => (
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
      </div>
    </div>
  );
  
  const DesktopFooter = () => (
    <div className="hidden sm:grid sm:grid-cols-12 gap-x-4 py-1">
      {/* Left column - Logo and venue info */}
      <div className="flex items-center col-span-4">
        <Shield className="h-3.5 w-3.5 text-primary mr-1.5" />
        <div>
          <span className="text-xs font-medium">{t("translation.common.appName")}</span>
          <span className="text-xs text-muted-foreground ml-1">
            • {venueInfo}
          </span>
        </div>
      </div>
      
      {/* Middle column - navigation links */}
      <div className="flex justify-center items-center space-x-4 col-span-4 mx-auto">
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
      
      {/* Right column - contact & copyright */}
      <div className="flex flex-col items-end justify-center col-span-4">
        <span className="text-xs text-muted-foreground">
          {email} • {phoneNumber}
        </span>
        <span className="text-xs text-muted-foreground">
          &copy; {currentYear} {t("translation.common.allRightsReserved")}
        </span>
      </div>
    </div>
  );
  
  const MobileFooter = () => (
    <div className="sm:hidden">
      {/* Top row - logo and venue */}
      <div className="flex items-center py-1 text-center justify-center">
        <Shield className="h-3 w-3 text-primary mr-1.5" />
        <span className="text-xs font-medium">{t("translation.common.appName")}</span>
        <span className="text-xs text-muted-foreground ml-1">
          • {venueInfo}
        </span>
      </div>
      
      {/* Bottom row - links and contact */}
      <div className="flex justify-between items-center py-1">
        <div className="flex space-x-4">
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
        <div className="text-xs text-muted-foreground">
          {phoneNumber}
        </div>
      </div>
    </div>
  );
  
  const FullFooter = () => (
    <>
      <DesktopFooter />
      <MobileFooter />
    </>
  );
  
  return (
    <footer className="border-t bg-background/80 dark:bg-gray-800/90 py-2 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-10 w-full">
      <div className="container mx-auto px-4 sm:px-8">
        {variant === 'simple' ? <SimpleFooter /> : <FullFooter />}
      </div>
    </footer>
  );
}