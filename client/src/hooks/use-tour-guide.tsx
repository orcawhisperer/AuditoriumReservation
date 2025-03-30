import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

// Define tour steps for different pages
const homePageSteps: Step[] = [
  {
    target: '.app-header',
    content: 'Welcome to Shahbaaz Auditorium Seat Reservation System! This is the header area where you can navigate the application.',
    placement: 'bottom',
  },
  {
    target: '.theme-toggle',
    content: 'Toggle between light and dark mode for your comfort.',
    placement: 'left',
  },
  {
    target: '.tour-guide-button',
    content: 'Click this button anytime to restart the tour.',
    placement: 'left',
  },
  {
    target: '.language-switcher',
    content: 'Switch between English and Hindi languages.',
    placement: 'bottom',
  },
  {
    target: '.user-menu',
    content: 'Access your profile or log out from the system here.',
    placement: 'bottom',
  },
  {
    target: '.upcoming-shows',
    content: 'Browse all upcoming shows here. Click on a show to reserve seats.',
    placement: 'left',
  },
  {
    target: '.your-reservations',
    content: 'View all your current reservations here. You can cancel reservations if needed.',
    placement: 'right',
  },
];

const showPageSteps: Step[] = [
  {
    target: '.seat-grid',
    content: 'This is the seat map. Choose your seats by clicking on them.',
    placement: 'top',
  },
  {
    target: '.seat-legend',
    content: 'Legend shows available, reserved, and your selected seats.',
    placement: 'bottom',
  },
  {
    target: '.section-indicator',
    content: 'Two sections are available: Balcony (B) and Downstairs (D).',
    placement: 'right',
  },
  {
    target: '.exit-indicator',
    content: 'Exit locations are marked for your safety awareness.',
    placement: 'left',
  },
  {
    target: '.reserve-button',
    content: 'Click here to confirm your reservation after selecting seats.',
    placement: 'top',
  },
];

const adminPageSteps: Step[] = [
  {
    target: '.admin-tabs',
    content: 'Navigation between different management sections.',
    placement: 'bottom',
  },
  {
    target: '.show-management',
    content: 'Create and manage shows, set dates, and upload poster images.',
    placement: 'left',
  },
  {
    target: '.user-management',
    content: 'Create and manage user accounts, reset passwords, and set seat limits.',
    placement: 'right',
  },
  {
    target: '.reservation-management',
    content: 'View and manage all reservations across the system.',
    placement: 'top',
  },
];

const profilePageSteps: Step[] = [
  {
    target: '.profile-update',
    content: 'Update your profile information here.',
    placement: 'left',
  },
  {
    target: '.password-change',
    content: 'Change your password to maintain security.',
    placement: 'right',
  },
];

interface TourGuideContextType {
  run: boolean;
  steps: Step[];
  startTour: () => void;
  stopTour: () => void;
  isTourAvailable: boolean;
}

const TourGuideContext = createContext<TourGuideContextType | null>(null);

export const TourGuideProvider = ({ children }: { children: ReactNode }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [location] = useLocation();
  const { t } = useTranslation();
  
  // Determine which steps to show based on current page
  useEffect(() => {
    console.log("TourGuide location changed:", location);
    
    if (location === '/') {
      console.log("Setting up home page tour steps");
      const mappedSteps = homePageSteps.map(step => ({
        ...step,
        content: t(`translation.tourGuide.${step.content}`, { defaultValue: step.content }),
      }));
      console.log("Home page steps:", mappedSteps);
      setSteps(mappedSteps);
    } else if (location.startsWith('/show/')) {
      console.log("Setting up show page tour steps");
      setSteps(showPageSteps.map(step => ({
        ...step,
        content: t(`translation.tourGuide.${step.content}`, { defaultValue: step.content }),
      })));
    } else if (location === '/admin') {
      console.log("Setting up admin page tour steps");
      setSteps(adminPageSteps.map(step => ({
        ...step,
        content: t(`translation.tourGuide.${step.content}`, { defaultValue: step.content }),
      })));
    } else if (location === '/profile') {
      console.log("Setting up profile page tour steps");
      setSteps(profilePageSteps.map(step => ({
        ...step,
        content: t(`translation.tourGuide.${step.content}`, { defaultValue: step.content }),
      })));
    } else {
      console.log("No tour steps available for this location");
      setSteps([]);
    }
    
    // Stop tour when changing pages
    setRun(false);
  }, [location, t]);

  // Check if tour is available on current page
  const isTourAvailable = steps.length > 0;

  // Handle tour callback
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
    }
  };

  const startTour = () => {
    console.log("startTour called, setting run to true");
    setRun(true);
    console.log("run state should be updated to true");
  };
  
  const stopTour = () => {
    console.log("stopTour called, setting run to false");
    setRun(false);
  };

  // For debugging
  useEffect(() => {
    console.log("Current run state:", run);
  }, [run]);

  return (
    <TourGuideContext.Provider value={{ run, steps, startTour, stopTour, isTourAvailable }}>
      {/* Debug checkbox - Remove in production */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 10001, background: 'white', padding: '5px' }}>
        <label>
          <input 
            type="checkbox" 
            checked={run} 
            onChange={(e) => {
              console.log("Debug checkbox clicked, setting run to:", e.target.checked);
              setRun(e.target.checked);
            }}
          />
          Force Enable Tour
        </label>
      </div>
      
      <Joyride
        callback={(data) => {
          console.log("Joyride callback:", data);
          handleJoyrideCallback(data);
        }}
        continuous
        hideCloseButton
        run={run}
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
      {children}
    </TourGuideContext.Provider>
  );
};

export const useTourGuide = () => {
  const context = useContext(TourGuideContext);
  if (!context) {
    throw new Error('useTourGuide must be used within a TourGuideProvider');
  }
  return context;
};