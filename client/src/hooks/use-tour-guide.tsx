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
    placement: 'bottom',
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
    if (location === '/') {
      setSteps(homePageSteps.map(step => ({
        ...step,
        content: t(`translation.tourGuide.${step.content}`, { defaultValue: step.content }),
      })));
    } else if (location.startsWith('/show/')) {
      setSteps(showPageSteps.map(step => ({
        ...step,
        content: t(`translation.tourGuide.${step.content}`, { defaultValue: step.content }),
      })));
    } else if (location === '/admin') {
      setSteps(adminPageSteps.map(step => ({
        ...step,
        content: t(`translation.tourGuide.${step.content}`, { defaultValue: step.content }),
      })));
    } else if (location === '/profile') {
      setSteps(profilePageSteps.map(step => ({
        ...step,
        content: t(`translation.tourGuide.${step.content}`, { defaultValue: step.content }),
      })));
    } else {
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

  const startTour = () => setRun(true);
  const stopTour = () => setRun(false);

  return (
    <TourGuideContext.Provider value={{ run, steps, startTour, stopTour, isTourAvailable }}>
      <Joyride
        callback={handleJoyrideCallback}
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