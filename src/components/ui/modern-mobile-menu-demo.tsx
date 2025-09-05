"use client";

import { ModernMobileMenu } from "@/components/ui/modern-mobile-menu";

const ModernMobileMenuDemo = () => {
  const menuItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <div className="h-screen flex items-center justify-center">
      <header className="bg-background p-4">
        <h1 className="text-2xl font-semibold">My Website</h1>
        <ModernMobileMenu items={menuItems} />
      </header>
    </div>
  );
};

export default ModernMobileMenuDemo;
