import React from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useTourGuide } from "@/hooks/use-tour-guide";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TourGuideButton() {
  const { startTour, isTourAvailable } = useTourGuide();
  const { t } = useTranslation();

  if (!isTourAvailable) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="tour-guide-button"
            onClick={startTour}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("translation.common.startTour")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}