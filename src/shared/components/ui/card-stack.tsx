"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface CardStackProps {
  items: {
    id: number;
    name: string;
    designation: string;
    content: React.ReactNode;
  }[];
}

const CardStack = ({ items }: CardStackProps) => {
  return (
    <div className="relative h-[300px] w-full overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform transition-all duration-500 ease-in-out",
            item.id % 2 === 0 ? "scale-90" : "scale-100"
          )}
        >
          <div className="relative z-10 flex flex-col items-center justify-center gap-4 rounded-lg bg-card p-6 shadow-md">
            <div className="text-center">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.designation}</p>
            </div>
            <div className="text-center">{item.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export { CardStack };
