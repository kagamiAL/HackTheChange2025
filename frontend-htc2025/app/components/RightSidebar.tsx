"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";

interface RightSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function RightSidebar({ children, className }: RightSidebarProps) {
  // Collapse by default on mobile screens
  const [isCollapsed, setIsCollapsed] = useState(
    typeof window !== 'undefined' && window.innerWidth < 1024
  );

  return (
    <div className="relative h-full">
      <aside
        className={cn(
          "flex h-full flex-col border-l border-border bg-background shadow-2xl transition-all duration-300 ease-in-out",
          isCollapsed ? "w-0 border-l-0" : "w-full sm:w-80 md:w-96",
          className
        )}
      >
        <div className={cn("w-full sm:w-80 md:w-96 h-full flex flex-col", isCollapsed && "invisible")}>
          {children}
        </div>
      </aside>

      {/* Toggle Button - always on the left edge of the sidebar */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute left-0 top-1/2 z-50 h-12 w-8 -translate-x-full -translate-y-1/2 rounded-l-lg rounded-r-none border-r-0 shadow-md transition-none hover:bg-background"
        aria-label={isCollapsed ? "Open sidebar" : "Close sidebar"}
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

interface RightSidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function RightSidebarHeader({ children, className }: RightSidebarHeaderProps) {
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

interface RightSidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

export function RightSidebarContent({ children, className }: RightSidebarContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto", className)}>
      {children}
    </div>
  );
}
