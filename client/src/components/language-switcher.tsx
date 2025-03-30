import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  // Store language selection in a ref to avoid re-renders
  const currentLangRef = React.useRef(i18n.language);
  
  // Properly handle state changes with dependency arrays
  const changeLanguage = React.useCallback((lng: string) => {
    if (currentLangRef.current !== lng) {
      currentLangRef.current = lng;
      i18n.changeLanguage(lng);
    }
  }, []); // No dependencies to prevent recreation

  // Use a side effect hook with proper dependency tracking
  React.useEffect(() => {
    // Synchronize ref with i18n only on mount
    currentLangRef.current = i18n.language;
  }, []); // Empty dependency array = only run once on mount

  // Create a stable reference for checking the current language
  const isSelected = React.useCallback((lang: string) => {
    return currentLangRef.current === lang;
  }, []); // No dependencies to prevent recreation

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Switch Language">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => changeLanguage("en")}
          className={isSelected("en") ? "bg-muted" : ""}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => changeLanguage("hi")}
          className={isSelected("hi") ? "bg-muted" : ""}
        >
          हिंदी (Hindi)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}