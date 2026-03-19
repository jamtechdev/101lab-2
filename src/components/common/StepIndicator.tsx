import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  allowedStep?: number;
  onStepClick?: (step: number) => void;
  data?: any;
}

const StepIndicator = ({
  currentStep,
  totalSteps,
  steps,
  allowedStep,
  onStepClick,
  data,
}: StepIndicatorProps) => {
  const maxAllowed = allowedStep || totalSteps;
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      {/* Mobile: compact "Step X of Y" with progress bar */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs font-medium text-primary">
            {steps[currentStep - 1]}
          </span>
        </div>
        <div className="w-full h-[2px] bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop: minimalist dot stepper */}
      <div className="hidden sm:block relative">
        {/* Background track line */}
        <div className="absolute top-[4px] left-0 right-0 h-[2px] bg-muted" />

        {/* Active progress line */}
        <div
          className="absolute top-[4px] left-0 h-[2px] bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Dots and labels */}
        <div className="relative flex items-start justify-between">
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isFuture = stepNumber > currentStep;
            const isDisabled = stepNumber > maxAllowed;

            return (
              <div
                key={stepNumber}
                className={cn(
                  "flex flex-col items-center",
                  !isDisabled ? "cursor-pointer" : "cursor-not-allowed",
                  isFuture && "opacity-30"
                )}
                style={{ width: `${100 / totalSteps}%` }}
                onClick={() => {
                  if (!isDisabled && onStepClick) onStepClick(stepNumber);
                }}
              >
                {/* Dot */}
                <div
                  className={cn(
                    "w-[10px] h-[10px] rounded-full transition-all duration-300 ring-2 ring-offset-2 ring-offset-background",
                    isCompleted && "bg-primary ring-primary",
                    isCurrent && "bg-primary ring-primary scale-125",
                    isFuture && "bg-muted ring-muted"
                  )}
                >
                  {isCompleted && (
                    <div className="w-full h-full flex items-center justify-center">
                      <Check className="w-[6px] h-[6px] text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Label: bold for current, step number for others */}
                <span
                  className={cn(
                    "mt-3 text-center leading-tight transition-all duration-300",
                    isCurrent
                      ? "text-xs font-bold text-foreground"
                      : "text-[10px] font-medium text-muted-foreground"
                  )}
                >
                  {isCurrent ? label : isCompleted ? `✓` : stepNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
