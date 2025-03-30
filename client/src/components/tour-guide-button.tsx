import React from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TourGuideButton() {
  const [joyrideTourOpen, setJoyrideTourOpen] = React.useState(false);
  const { t } = useTranslation();
  
  // Use useEffect to log state changes
  React.useEffect(() => {
    console.log("TourGuideButton - joyrideTourOpen changed to:", joyrideTourOpen);
  }, [joyrideTourOpen]);
  
  // Define steps directly here
  const steps = [
    {
      target: '.app-header',
      content: 'Welcome to Shahbaaz Auditorium Seat Reservation System! This is the header area where you can navigate the application.',
      placement: 'bottom' as const,
    },
    {
      target: '.theme-toggle',
      content: 'Toggle between light and dark mode for your comfort.',
      placement: 'left' as const,
    },
    {
      target: '.language-switcher',
      content: 'Switch between English and Hindi languages.',
      placement: 'bottom' as const,
    },
    {
      target: '.user-menu',
      content: 'Access your profile or log out from the system here.',
      placement: 'bottom' as const,
    },
    {
      target: '.upcoming-shows',
      content: 'Browse all upcoming shows here. Click on a show to reserve seats.',
      placement: 'left' as const,
    },
    {
      target: '.your-reservations',
      content: 'View all your current reservations here. You can cancel reservations if needed.',
      placement: 'right' as const,
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    console.log("Joyride callback", data);
    const { status } = data;
    
    // Use string literals to check status since we're having type issues
    if (status === 'finished' || status === 'skipped') {
      setJoyrideTourOpen(false);
    }
  };

  return (
    <>
      {/* Debug indicator */}
      {joyrideTourOpen && (
        <div style={{ 
          position: 'fixed', 
          top: '40px', 
          left: '10px', 
          background: 'green', 
          color: 'white', 
          padding: '5px', 
          zIndex: 10001,
          borderRadius: '4px'
        }}>
          Tour Active
        </div>
      )}
      
      {/* This is a simplified version that doesn't depend on the complex context */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="tour-guide-button"
              onClick={() => {
                console.log("Tour guide button clicked, opening tour");
                setJoyrideTourOpen(true);
                console.log("joyrideTourOpen set to true");
              }}
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("translation.common.startTour")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Add debug button to manually toggle tour */}
      <div style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 10001 }}>
        <button 
          style={{ background: joyrideTourOpen ? 'red' : 'blue', color: 'white', padding: '5px' }}
          onClick={() => setJoyrideTourOpen(!joyrideTourOpen)}
        >
          {joyrideTourOpen ? 'Stop Tour' : 'Start Tour'}
        </button>
      </div>
      
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        hideCloseButton
        run={joyrideTourOpen}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={steps}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: 'var(--primary)',
            backgroundColor: 'var(--background)',
            textColor: 'var(--foreground)',
          },
        }}
      />
    </>
  );
}