"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button.radix";

interface SocialIcon {
  Icon: React.ComponentType<any>;
  href: string;
  className?: string;
}

interface FloatingActionButtonProps {
  icons: SocialIcon[];
  iconSize?: number;
}

const FloatingActionButton = ({ icons, iconSize = 20 }: FloatingActionButtonProps) => {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      {icons.map((icon, index) => (
        <Button
          key={index}
          variant="ghost"
          className={cn("rounded-full p-2", icon.className)}
        >
          <icon.Icon size={iconSize} />
        </Button>
      ))}
    </div>
  );
};

export { FloatingActionButton };
