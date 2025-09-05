"use client";

import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Github, Twitter, Linkedin, Instagram, Youtube, Facebook } from "lucide-react";

const socialIcons = [
  { Icon: Github, href: "https://github.com", className: "text-gray-500 hover:text-gray-700" },
  { Icon: Twitter, href: "https://twitter.com", className: "text-blue-500 hover:text-blue-700" },
  { Icon: Linkedin, href: "https://linkedin.com", className: "text-blue-700 hover:text-blue-900" },
  { Icon: Instagram, href: "https://instagram.com", className: "text-pink-500 hover:text-pink-700" },
  { Icon: Youtube, href: "https://youtube.com", className: "text-red-500 hover:text-red-700" },
  { Icon: Facebook, href: "https://facebook.com", className: "text-blue-600 hover:text-blue-800" },
];

const FloatingActionButtonDemo = () => {
  return (
    <div className="h-[40rem] flex items-center justify-center w-full">
      <main className="w-full min-h-screen flex items-start md:items-center justify-center px-4 py-10 bg-background">
        <FloatingActionButton 
          icons={socialIcons}
          iconSize={20}
        />
      </main>
    </div>
  );
};

export default FloatingActionButtonDemo;
