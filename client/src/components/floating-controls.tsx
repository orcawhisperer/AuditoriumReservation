import React, { useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Languages, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

export function FloatingControls() {
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleLanguage = () => {
    const currentLanguage = i18n.language;
    const newLanguage = currentLanguage === "en" ? "hi" : "en";
    i18n.changeLanguage(newLanguage);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      {expanded && (
        <>
          <Button
            size="icon"
            variant="outline"
            onClick={toggleTheme}
            className="rounded-full shadow-md bg-background hover:bg-background/90"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            onClick={toggleLanguage}
            className="rounded-full shadow-md bg-background hover:bg-background/90"
            aria-label="Toggle language"
          >
            <Languages className="h-5 w-5" />
          </Button>
        </>
      )}

      <Button
        size="icon"
        variant={expanded ? "destructive" : "default"}
        onClick={() => setExpanded(!expanded)}
        className="rounded-full shadow-md"
        aria-label={expanded ? "Close controls" : "Open controls"}
      >
        {expanded ? <X className="h-5 w-5" /> : <Languages className="h-5 w-5" />}
      </Button>
    </div>
  );
}