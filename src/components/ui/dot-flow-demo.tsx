"use client";

import { useState } from "react";
import { DotFlow } from "@/components/ui/dot-flow";

const DotFlowDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Step 1", "Step 2", "Step 3", "Step 4"];

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-semibold mb-4">Dot Flow Demo</h1>
      <DotFlow steps={steps} currentStep={currentStep} />
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setCurrentStep((prev) => (prev > 0 ? prev - 1 : 0))}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev))}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DotFlowDemo;
