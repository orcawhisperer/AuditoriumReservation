import React from 'react';
import { ThemeToggle } from "@/components/theme-toggle";
import { TourGuideButton } from "@/components/tour-guide-button";

export function FloatingActionButtons() {
  // Debug info to check if class names exist in DOM
  React.useEffect(() => {
    setTimeout(() => {
      console.log("Checking DOM for tour targets:");
      console.log(".theme-toggle exists:", document.querySelector(".theme-toggle") !== null);
      console.log(".tour-guide-button exists:", document.querySelector(".tour-guide-button") !== null);
      console.log(".user-menu exists:", document.querySelector(".user-menu") !== null);
      console.log(".upcoming-shows exists:", document.querySelector(".upcoming-shows") !== null);
      console.log(".your-reservations exists:", document.querySelector(".your-reservations") !== null);
      console.log(".app-header exists:", document.querySelector(".app-header") !== null);
      console.log(".language-switcher exists:", document.querySelector(".language-switcher") !== null);
    }, 1000);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      <div className="p-2 bg-background border border-border rounded-full shadow-lg theme-toggle-container">
        <ThemeToggle />
      </div>
      <div className="p-2 bg-background border border-border rounded-full shadow-lg tour-guide-container">
        <TourGuideButton />
      </div>
    </div>
  );
}