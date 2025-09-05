"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox as RadixCheckbox, CheckboxIndicator } from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

type CheckedState = boolean | 'indeterminate';

interface CheckboxProps extends Omit<React.ComponentPropsWithoutRef<typeof RadixCheckbox>, 'checked' | 'onCheckedChange'> {
  label: string;
  checked?: CheckedState;
  onCheckedChange?: (checked: CheckedState) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <RadixCheckbox
          ref={ref}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded border border-primary ring-offset-background focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          <CheckboxIndicator>
            <Check className="size-4" />
          </CheckboxIndicator>
        </RadixCheckbox>
        <label
          className={cn(
            "cursor-pointer select-none text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            className
          )}
        >
          {label}
        </label>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
