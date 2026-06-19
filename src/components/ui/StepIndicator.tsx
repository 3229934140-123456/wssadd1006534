import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStepNameChinese } from '@/utils/scoring';
import type { StepName } from '@/types';

interface StepIndicatorProps {
  steps: StepName[];
  currentStep: number;
  completedSteps: number[];
  className?: string;
}

export const StepIndicator = ({
  steps,
  currentStep,
  completedSteps,
  className
}: StepIndicatorProps) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div
            className="h-full bg-gradient-to-r from-[#1A73E8] to-[#34A853] transition-all duration-500 ease-out"
            style={{
              width: steps.length > 1 
                ? `${(Math.max(currentStep, completedSteps.length - 1) / (steps.length - 1)) * 100}%`
                : '100%'
            }}
          />
        </div>
        
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = index === currentStep && !isCompleted;
          
          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10',
                  isCompleted && 'bg-[#34A853] border-[#34A853] text-white',
                  isCurrent && 'bg-white border-[#1A73E8] text-[#1A73E8] ring-4 ring-[#1A73E8]/20 animate-pulse',
                  !isCompleted && !isCurrent && 'bg-white border-gray-300 text-gray-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-bold">{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium whitespace-nowrap',
                  isCurrent && 'text-[#1A73E8]',
                  isCompleted && 'text-[#34A853]',
                  !isCompleted && !isCurrent && 'text-gray-400'
                )}
              >
                {getStepNameChinese(step)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
