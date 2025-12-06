"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui";
import { ChevronDown } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

interface InlineDropdownProps {
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}

const InlineDropdown = ({ options, onSelect }: InlineDropdownProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(options[0].value);

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button variant="outline" className="flex items-center justify-between w-full">
          {options.find((opt) => opt.value === selectedValue)?.label || options[0].label}
          <ChevronDown className="size-4" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content className="w-48 p-2 bg-popover rounded-md shadow-md">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "w-full px-2 py-1.5 text-left rounded hover:bg-accent",
              option.value === selectedValue && "bg-accent"
            )}
          >
            {option.label}
          </button>
        ))}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
};

export { InlineDropdown };
