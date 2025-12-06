"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface StickyBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top" | "bottom";
}

const StickyBanner = React.forwardRef<HTMLDivElement, StickyBannerProps>(
  ({ className, position = "top", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "sticky z-50 w-full px-4 py-2 text-center text-sm font-medium transition-all duration-300 ease-in-out",
          position === "top" ? "top-0" : "bottom-0",
          className
        )}
        {...props}
      >
        <div className="mx-auto max-w-4xl">
          {children}
        </div>
      </div>
    );
  }
);
StickyBanner.displayName = "StickyBanner";

export { StickyBanner };
