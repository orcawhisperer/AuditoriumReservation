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
  const venueInfo = "Military Command Center Venue";
  
  // Simple column-based footer with centered content for login/auth page
  const SimpleFooter = () => (
    <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
      <div className="flex items-center gap-1.5">
        <Shield className="h-3 w-3 text-primary" />
        <span className="text-xs font-medium">{t("translation.common.appName")}</span>
      </div>
      
      <button 
        onClick={() => setLocation("/about")}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("translation.common.about")} / {t("translation.common.contact")}
      </button>
      
      <span className="text-xs text-muted-foreground">
        &copy; {currentYear}
      </span>
    </div>
  );
  
  // Column-based desktop footer with centered content
  const DesktopFooter = () => (
    <div className="hidden sm:flex flex-col items-center justify-center space-y-1.5 py-1">
      {/* Logo and venue info */}
      <div className="flex items-center">
        <Shield className="h-3.5 w-3.5 text-primary mr-1.5" />
        <span className="text-xs font-medium">{t("translation.common.appName")}</span>
        <span className="text-xs text-muted-foreground ml-1">
          • {venueInfo}
        </span>
      </div>
      
      {/* About/Contact link */}
      <button 
        onClick={() => setLocation("/about")}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("translation.common.about")} / {t("translation.common.contact")}
      </button>
      
      {/* Copyright */}
      <span className="text-xs text-muted-foreground">
        &copy; {currentYear} {t("translation.common.allRightsReserved")}
      </span>
    </div>
  );
  
  // Column-based mobile footer with centered content
  const MobileFooter = () => (
    <div className="sm:hidden flex flex-col items-center justify-center space-y-1 py-1">
      {/* Logo and venue info */}
      <div className="flex items-center">
        <Shield className="h-3 w-3 text-primary mr-1.5" />
        <span className="text-xs font-medium">{t("translation.common.appName")}</span>
        <span className="text-xs text-muted-foreground ml-1">
          • {venueInfo}
        </span>
      </div>
      
      {/* About/Contact link */}
      <button 
        onClick={() => setLocation("/about")}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("translation.common.about")} / {t("translation.common.contact")}
      </button>
      
      {/* Copyright */}
      <span className="text-xs text-muted-foreground">
        &copy; {currentYear}
      </span>
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