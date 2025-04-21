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
    <div className="hidden sm:flex justify-between items-center py-1">
      {/* Left - Logo and venue info */}
      <div className="flex items-center">
        <Shield className="h-3.5 w-3.5 text-primary mr-1.5" />
        <div>
          <span className="text-xs font-medium">{t("translation.common.appName")}</span>
          <span className="text-xs text-muted-foreground ml-1">
            • {venueInfo}
          </span>
        </div>
      </div>
      
      {/* Center - About link */}
      <div className="flex items-center">
        <button 
          onClick={() => setLocation("/about")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("translation.common.about")}
        </button>
      </div>
      
      {/* Right - copyright */}
      <div className="flex items-center">
        <span className="text-xs text-muted-foreground">
          &copy; {currentYear} {t("translation.common.allRightsReserved")}
        </span>
      </div>
    </div>
  );
  
  const MobileFooter = () => (
    <div className="sm:hidden flex flex-col">
      {/* Top row - logo and venue */}
      <div className="flex items-center justify-center py-1">
        <Shield className="h-3 w-3 text-primary mr-1.5" />
        <span className="text-xs font-medium">{t("translation.common.appName")}</span>
        <span className="text-xs text-muted-foreground ml-1">
          • {venueInfo}
        </span>
      </div>
      
      {/* Bottom row - about and copyright */}
      <div className="flex justify-between items-center py-1">
        <button 
          onClick={() => setLocation("/about")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("translation.common.about")}
        </button>
        <span className="text-xs text-muted-foreground">
          &copy; {currentYear}
        </span>
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