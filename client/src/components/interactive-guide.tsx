import React, { useState, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useTranslation } from 'react-i18next';
import { TourStep, useInteractiveGuide } from '@/hooks/use-interactive-guide';
import { Button } from '@/components/ui/button';
import { LightbulbIcon, HelpCircleIcon, XIcon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

// Convert our custom TourStep type to react-joyride Step type
const convertToJoyrideSteps = (steps: TourStep[]): Step[] => {
  return steps.map(step => ({
    target: step.target,
    content: (
      <div className="p-1">
        {step.title && <h3 className="text-lg font-bold mb-2">{step.title}</h3>}
        <p className="text-sm">{step.content}</p>
      </div>
    ),
    disableBeacon: step.disableBeacon,
    placement: step.placement,
    spotlightClicks: step.spotlightClicks,
    disableOverlayClose: step.disableOverlayClose,
    hideCloseButton: step.hideCloseButton,
    hideFooter: step.hideFooter,
    isFixed: step.isFixed,
    offset: step.offset
  }));
};

export const InteractiveGuide: React.FC = () => {
  const { 
    isTourActive, 
    currentTourType, 
    tourSteps, 
    stepIndex, 
    setStepIndex, 
    completeTour, 
    startTour, 
    resetCompletedTours 
  } = useInteractiveGuide();
  
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  // For the floating help button
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);

  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    // Update the current step index
    if (action === 'update' && type === 'step:after') {
      setStepIndex(index + 1);
    }

    // Handle tour completion or skip
    if (status === 'finished' || status === 'skipped') {
      if (currentTourType) {
        completeTour(currentTourType);
      }
    }
  }, [currentTourType, completeTour, setStepIndex]);

  // Start different tours based on user choice
  const handleStartTour = (tourType: 'admin' | 'user' | 'auth' | 'seat-selection' | 'profile') => {
    startTour(tourType);
    setIsHelpMenuOpen(false);
  };

  // Reset all completed tours
  const handleResetTours = () => {
    resetCompletedTours();
    setIsHelpMenuOpen(false);
  };

  // Convert our steps to Joyride format
  const joyrideSteps = convertToJoyrideSteps(tourSteps);

  return (
    <>
      {/* Joyride tour component */}
      <Joyride
        callback={handleJoyrideCallback}
        continuous
        run={isTourActive}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={joyrideSteps}
        stepIndex={stepIndex}
        styles={{
          options: {
            arrowColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            primaryColor: '#0ea5e9', // Sky blue color that works in both themes
            textColor: theme === 'dark' ? '#e5e7eb' : '#374151',
            spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
            beaconSize: 36,
            zIndex: 10000,
          },
          tooltipContainer: {
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            textAlign: 'left'
          },
          tooltip: {
            fontSize: '1rem',
            padding: '1rem'
          },
          buttonNext: {
            backgroundColor: '#0ea5e9',
            borderRadius: '0.375rem',
            color: '#ffffff',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem'
          },
          buttonBack: {
            marginRight: '0.5rem',
            fontSize: '0.875rem',
            padding: '0.5rem 1rem'
          },
          buttonSkip: {
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            fontSize: '0.875rem'
          }
        }}
        floaterProps={{
          disableAnimation: false,
          styles: {
            floater: {
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
            }
          }
        }}
        locale={{
          back: t('translation.guide.buttons.back'),
          close: t('translation.guide.buttons.close'),
          last: t('translation.guide.buttons.finish'),
          next: t('translation.guide.buttons.next'),
          skip: t('translation.guide.buttons.skip')
        }}
      />

      {/* Help menu button */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
            className="rounded-full h-12 w-12 shadow-lg bg-primary hover:bg-primary/90 text-white"
            aria-label={t('translation.guide.helpButton')}
          >
            {isHelpMenuOpen ? (
              <XIcon className="h-5 w-5" />
            ) : (
              <HelpCircleIcon className="h-5 w-5" />
            )}
          </Button>

          {/* Help menu dropdown */}
          {isHelpMenuOpen && (
            <div className="absolute bottom-14 right-0 w-64 bg-card rounded-lg shadow-lg p-4 border border-border animate-in fade-in slide-in-from-bottom-5 duration-200">
              <h3 className="text-lg font-bold flex items-center mb-3">
                <LightbulbIcon className="h-5 w-5 mr-2 text-amber-500" />
                {t('translation.guide.menu.title')}
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleStartTour('user')}
                >
                  {t('translation.guide.menu.userGuide')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleStartTour('admin')}
                >
                  {t('translation.guide.menu.adminGuide')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleStartTour('seat-selection')}
                >
                  {t('translation.guide.menu.seatGuide')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleStartTour('profile')}
                >
                  {t('translation.guide.menu.profileGuide')}
                </Button>
                <div className="pt-2 border-t mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left text-muted-foreground"
                    onClick={handleResetTours}
                  >
                    {t('translation.guide.menu.resetGuides')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Component that triggers a specific tour automatically
export const TourTrigger: React.FC<{
  tourType: 'admin' | 'user' | 'auth' | 'seat-selection' | 'profile';
  children?: React.ReactNode;
}> = ({ tourType, children }) => {
  const { startTour } = useInteractiveGuide();
  
  return (
    <Button
      onClick={() => startTour(tourType)}
      variant="outline"
      size="sm"
      className="flex items-center gap-1"
    >
      <HelpCircleIcon className="h-4 w-4" />
      {children}
    </Button>
  );
};