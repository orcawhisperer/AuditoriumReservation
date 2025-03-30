import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from './use-auth';

// Types for our tour steps
export type TourStep = {
  target: string;
  content: string;
  title?: string;
  disableBeacon?: boolean;
  placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'right';
  spotlightClicks?: boolean;
  disableOverlayClose?: boolean;
  hideCloseButton?: boolean;
  hideFooter?: boolean;
  isFixed?: boolean;
  offset?: number;
};

export type TourType = 'admin' | 'user' | 'auth' | 'seat-selection' | 'profile';

// Predefined tours for different user flows
const getTourSteps = (tourType: TourType, t: (key: string) => string): TourStep[] => {
  switch (tourType) {
    case 'admin':
      return [
        {
          target: '#admin-header',
          title: t('translation.guide.admin.welcome.title'),
          content: t('translation.guide.admin.welcome.content'),
          disableBeacon: true
        },
        {
          target: '#admin-tabs',
          title: t('translation.guide.admin.tabs.title'),
          content: t('translation.guide.admin.tabs.content')
        },
        {
          target: '#shows-management',
          title: t('translation.guide.admin.shows.title'),
          content: t('translation.guide.admin.shows.content')
        },
        {
          target: '#users-management',
          title: t('translation.guide.admin.users.title'),
          content: t('translation.guide.admin.users.content')
        },
        {
          target: '#reservations-management',
          title: t('translation.guide.admin.reservations.title'),
          content: t('translation.guide.admin.reservations.content')
        }
      ];
    case 'user':
      return [
        {
          target: '#user-header',
          title: t('translation.guide.user.welcome.title'),
          content: t('translation.guide.user.welcome.content'),
          disableBeacon: true
        },
        {
          target: '#show-list',
          title: t('translation.guide.user.shows.title'),
          content: t('translation.guide.user.shows.content')
        },
        {
          target: '#reservation-list',
          title: t('translation.guide.user.reservations.title'),
          content: t('translation.guide.user.reservations.content')
        },
        {
          target: '#user-actions',
          title: t('translation.guide.user.actions.title'),
          content: t('translation.guide.user.actions.content')
        }
      ];
    case 'auth':
      return [
        {
          target: '#auth-form',
          title: t('translation.guide.auth.welcome.title'),
          content: t('translation.guide.auth.welcome.content'),
          disableBeacon: true
        },
        {
          target: '#login-form',
          title: t('translation.guide.auth.login.title'),
          content: t('translation.guide.auth.login.content')
        },
        {
          target: '#register-form',
          title: t('translation.guide.auth.register.title'),
          content: t('translation.guide.auth.register.content')
        }
      ];
    case 'seat-selection':
      return [
        {
          target: '#seat-selection-header',
          title: t('translation.guide.seats.welcome.title'),
          content: t('translation.guide.seats.welcome.content'),
          disableBeacon: true
        },
        {
          target: '#seat-grid',
          title: t('translation.guide.seats.grid.title'),
          content: t('translation.guide.seats.grid.content'),
          spotlightClicks: true
        },
        {
          target: '#seat-legend',
          title: t('translation.guide.seats.legend.title'),
          content: t('translation.guide.seats.legend.content')
        },
        {
          target: '#reservation-actions',
          title: t('translation.guide.seats.actions.title'),
          content: t('translation.guide.seats.actions.content')
        }
      ];
    case 'profile':
      return [
        {
          target: '#profile-header',
          title: t('translation.guide.profile.welcome.title'),
          content: t('translation.guide.profile.welcome.content'),
          disableBeacon: true
        },
        {
          target: '#profile-info',
          title: t('translation.guide.profile.info.title'),
          content: t('translation.guide.profile.info.content')
        },
        {
          target: '#change-password',
          title: t('translation.guide.profile.password.title'),
          content: t('translation.guide.profile.password.content')
        }
      ];
    default:
      return [];
  }
};

// Custom hook for handling tour state
export const useInteractiveGuide = () => {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Use localStorage to remember which tours the user has completed
  const [completedTours, setCompletedTours] = useState<TourType[]>(() => {
    try {
      const stored = localStorage.getItem('shahbaaz-completed-tours');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return [];
    }
  });
  
  // Active tour state
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourType, setCurrentTourType] = useState<TourType | null>(null);
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);

  // Helper function to determine if a tour has been completed
  const isTourCompleted = useCallback((tourType: TourType) => {
    return completedTours.includes(tourType);
  }, [completedTours]);

  // Start a tour
  const startTour = useCallback((tourType: TourType) => {
    setCurrentTourType(tourType);
    setTourSteps(getTourSteps(tourType, t));
    setStepIndex(0);
    setIsTourActive(true);
  }, [t]);

  // Mark a tour as completed
  const completeTour = useCallback((tourType: TourType) => {
    if (!isTourCompleted(tourType)) {
      const newCompletedTours = [...completedTours, tourType];
      setCompletedTours(newCompletedTours);
      try {
        localStorage.setItem('shahbaaz-completed-tours', JSON.stringify(newCompletedTours));
      } catch (e) {
        console.error('Error writing to localStorage', e);
      }
    }
    setIsTourActive(false);
    setCurrentTourType(null);
  }, [completedTours, isTourCompleted]);

  // Reset the completed tours (for testing or user preference)
  const resetCompletedTours = useCallback(() => {
    setCompletedTours([]);
    try {
      localStorage.setItem('shahbaaz-completed-tours', JSON.stringify([]));
    } catch (e) {
      console.error('Error writing to localStorage', e);
    }
  }, []);

  // Auto-suggest tours based on current location and completion status
  useEffect(() => {
    if (isTourActive) return;

    // Determine which tour to suggest based on current path
    const pathToTourMap: Record<string, TourType> = {
      '/': 'user',
      '/admin': 'admin',
      '/auth': 'auth',
      '/show': 'seat-selection',
      '/profile': 'profile'
    };

    const suggestedTourType = Object.entries(pathToTourMap).find(([path]) => 
      location.startsWith(path)
    )?.[1];

    // Don't auto-start tours that have been completed
    if (suggestedTourType && !isTourCompleted(suggestedTourType)) {
      // Delay the tour start to allow the page to fully render
      const timer = setTimeout(() => {
        startTour(suggestedTourType);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [location, isTourActive, isTourCompleted, startTour]);

  return {
    isTourActive,
    currentTourType,
    tourSteps,
    stepIndex,
    setStepIndex,
    startTour,
    completeTour,
    isTourCompleted,
    resetCompletedTours
  };
};