import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Home, Work, CalendarMonth, Security, Settings } from '@mui/icons-material';

type IconComponentType = React.ElementType<{ className?: string } | any>;
export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  accentColor?: string;
}

const defaultItems: InteractiveMenuItem[] = [
  { label: 'home', icon: Home },
  { label: 'strategy', icon: Work },
  { label: 'period', icon: CalendarMonth },
  { label: 'security', icon: Security },
  { label: 'settings', icon: Settings },
];

const defaultAccentColor = 'var(--component-active-color-default)';

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor }) => {

  const finalItems = useMemo(() => {
     const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
     if (!isValid) {
        console.warn("InteractiveMenu: 'items' prop is invalid or missing. Using default items.", items);
        return defaultItems;
     }
     return items;
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
      if (activeIndex >= finalItems.length) {
          setActiveIndex(0);
      }
  }, [finalItems, activeIndex]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();

    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [activeIndex, finalItems]);

  const handleItemClick = (index: number) => {
    setActiveIndex(index);
  };

  const navStyle = useMemo(() => {
      const activeColor = accentColor || defaultAccentColor;
      return { '--component-active-color': activeColor } as React.CSSProperties;
  }, [accentColor]); 

  return (
    <nav
      className="menu"
      role="navigation"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const isTextActive = isActive;


        const IconComponent = item.icon;

        return (
          <button
            key={item.label}
            className={`menu__item ${isActive ? 'active' : ''}`}
            onClick={() => handleItemClick(index)}
            ref={(el) => (itemRefs.current[index] = el)}
            style={{ '--lineWidth': '0px' } as React.CSSProperties} 
          >
            <div className="menu__icon">
              <IconComponent className="icon" />
            </div>
            <strong
              className={`menu__text ${isTextActive ? 'active' : ''}`}
              ref={(el) => (textRefs.current[index] = el)}
            >
              {item.label}
            </strong>
          </button>
        );
      })}
    </nav>
  );
};

export {InteractiveMenu}
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
