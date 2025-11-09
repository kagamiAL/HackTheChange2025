"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";

interface LeftSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function LeftSidebar({ children, className }: LeftSidebarProps) {
  // Start collapsed by default
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Update CSS variable for sidebar width
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const width = isCollapsed ? '0px' : window.innerWidth < 640 ? '100vw' : window.innerWidth < 768 ? '24rem' : '28rem';
      document.documentElement.style.setProperty('--left-sidebar-width', width);
    }
  }, [isCollapsed]);

  return (
    <div className="relative h-full">
      <aside
        className={cn(
          "flex h-full flex-col border-r border-border bg-background shadow-2xl transition-all duration-300 ease-in-out",
          isCollapsed ? "w-0 border-r-0" : "w-full sm:w-96 md:w-[28rem]",
          className
        )}
      >
        <div className={cn("w-full sm:w-96 md:w-[28rem] h-full flex flex-col", isCollapsed && "invisible")}>
          {children}
        </div>
      </aside>

      {/* Toggle Button - always on the right edge of the sidebar */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute right-0 top-1/2 z-50 h-12 w-8 -translate-y-1/2 translate-x-full rounded-r-lg rounded-l-none border-l-0 shadow-md transition-none hover:bg-background"
        aria-label={isCollapsed ? "Open sidebar" : "Close sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

interface LeftSidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function LeftSidebarHeader({ children, className }: LeftSidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center border-b border-border px-4 py-3",
        className
      )}
    >
      {children}
    </div>
  );
}

interface LeftSidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

export function LeftSidebarContent({ children, className }: LeftSidebarContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto", className)}>
      {children}
    </div>
  );
}
