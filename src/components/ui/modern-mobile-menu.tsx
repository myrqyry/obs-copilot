"use client";

import React from "react";
import { Button } from "@/components/ui/button.radix";
import { X, Menu } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface MobileMenuItem {
  label: string;
  href: string;
}

interface ModernMobileMenuProps {
  items: MobileMenuItem[];
}

const ModernMobileMenu = ({ items }: ModernMobileMenuProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" className="p-2">
          <Menu className="size-6" />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50" />
        <DialogPrimitive.Content className="fixed inset-0 flex flex-col items-center justify-center">
          <div className="bg-background p-4 rounded-md shadow-md w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold">Menu</h3>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                <X className="size-6" />
              </Button>
            </div>
            <nav className="flex flex-col gap-4">
              {items.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="text-lg font-medium hover:underline"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export { ModernMobileMenu };
