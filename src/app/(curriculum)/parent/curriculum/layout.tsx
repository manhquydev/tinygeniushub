"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  LayoutDashboard, 
  Calendar,
  Settings,
  ChevronLeft
} from "lucide-react";
import { abekaColors } from "@/components/curriculum/design-tokens";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    href: "/parent/curriculum",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/parent/curriculum/browser",
    label: "Browse Syllabus",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    href: "/parent/curriculum/planner",
    label: "Planning",
    icon: <Calendar className="h-4 w-4" />,
  },
];

export default function CurriculumParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Back */}
            <div className="flex items-center gap-4">
              <Link href="/parent/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Come back
                </Button>
              </Link>
              
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: abekaColors.amberDiep }}
                >
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-slate-800">Abeka Curriculum</span>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center justify-around border-t py-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                className="flex-col gap-1 h-auto py-2"
              >
                {item.icon}
                <span className="text-[10px]">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}
