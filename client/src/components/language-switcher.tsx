import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

// Simple custom dropdown to avoid the complex Radix UI component that's causing issues
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Use a single callback for changing language
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Switch Language"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Globe className="h-5 w-5" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-popover border border-border z-50">
          <div className="py-1 rounded-md">
            <button
              onClick={() => changeLanguage("en")}
              className={cn(
                "flex w-full items-center px-4 py-2 text-sm hover:bg-accent",
                i18n.language === "en" ? "bg-muted" : ""
              )}
            >
              English
            </button>
            <button
              onClick={() => changeLanguage("hi")}
              className={cn(
                "flex w-full items-center px-4 py-2 text-sm hover:bg-accent",
                i18n.language === "hi" ? "bg-muted" : ""
              )}
            >
              हिंदी (Hindi)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}