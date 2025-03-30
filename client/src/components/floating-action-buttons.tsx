import React from 'react';
import { ThemeToggle } from "@/components/theme-toggle";
import { TourGuideButton } from "@/components/tour-guide-button";

export function FloatingActionButtons() {
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