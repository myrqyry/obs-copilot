"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PlaceholdersAndVanishInputProps extends React.HTMLAttributes<HTMLInputElement> {
  placeholders: string[];
  onValueChange?: (value: string) => void;
  onSubmit?: () => void;
}

const PlaceholdersAndVanishInput = React.forwardRef<HTMLInputElement, PlaceholdersAndVanishInputProps>(
  ({ className, placeholders, onValueChange, onSubmit, ...props }, ref) => {
    const [currentPlaceholder, setCurrentPlaceholder] = React.useState(0);
    const [value, setValue] = React.useState("");

    const handleFocus = () => {
      setCurrentPlaceholder(0);
    };

    const handleBlur = () => {
      if (value.trim() === "") {
        setCurrentPlaceholder(1);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit?.();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <div className={cn("relative w-full", className)}>
        <input
          ref={ref}
          type="text"
          className={cn(
            "w-full border-b border-input bg-transparent p-0 text-base focus:outline-none focus:ring-0",
            "placeholder:text-muted-foreground",
            className
          )}
          placeholder={placeholders[currentPlaceholder]}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          {...props}
        />
      </div>
    );
  }
);
PlaceholdersAndVanishInput.displayName = "PlaceholdersAndVanishInput";

export { PlaceholdersAndVanishInput };
