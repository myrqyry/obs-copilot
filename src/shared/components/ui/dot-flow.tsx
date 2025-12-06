"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import * as motion from "motion/react-client";

interface DotFlowProps {
  steps: string[];
  currentStep: number;
}

const DotFlow = ({ steps, currentStep }: DotFlowProps) => {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          layoutId={`dot-${index}`}
          layout="position"
          className={cn(
            "w-4 h-4 rounded-full",
            index === currentStep ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
};

export { DotFlow };
