"use client";

import { useState } from "react";
import { Heart, Sparkles, MapPin, Users2 } from "lucide-react";

import Map from "./components/Map";
import { FriendsPanel } from "./components/FriendsPanel";
import { FavoritesList } from "./components/FavoritesList";
import { LeftSidebar, LeftSidebarContent, LeftSidebarHeader } from "./components/LeftSidebar";
import SwipeView from "./components/SwipeView";
import { RightSidebar, RightSidebarContent, RightSidebarHeader } from "./components/RightSidebar";
import { WelcomeModal } from "./components/WelcomeModal";
import { useOpportunities } from "./context/OpportunityContext";
import { useFavorites } from "./context/FavoritesContext";
import { cn } from "@/lib/utils";

export default function Home() {
  const { hideRemoteOpportunities, setHideRemoteOpportunities } = useOpportunities();
  const { reloadFavorites } = useFavorites();
  const rightSidebarTabs = [
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "friends", label: "Friends", icon: Users2 },
  ] as const;
  type TabId = (typeof rightSidebarTabs)[number]["id"];
  const [activeRightSidebarTab, setActiveRightSidebarTab] = useState<TabId>("favorites");

  const handleRightSidebarTabChange = (tabId: TabId) => {
    if (tabId === "favorites") {
      reloadFavorites();
    }
    setActiveRightSidebarTab(tabId);
  };

  return (
    <div className="w-full h-full overflow-hidden bg-zinc-50 relative">
      <WelcomeModal />
      {/* Main Map Area */}
      <main className="w-full h-full">
        <Map />
      </main>

      {/* Left Sidebar - Overlaying the map */}
      <div className="absolute top-0 left-0 bottom-0">
        <LeftSidebar>
          <LeftSidebarHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500 fill-violet-500" />
                <h2 className="text-lg font-semibold">Discover</h2>
              </div>
              <button
                onClick={() => setHideRemoteOpportunities(!hideRemoteOpportunities)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  hideRemoteOpportunities
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
                aria-label="Toggle remote opportunities"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Local only</span>
              </button>
            </div>
          </LeftSidebarHeader>
          <LeftSidebarContent>
            <SwipeView />
          </LeftSidebarContent>
        </LeftSidebar>
      </div>

      {/* Right Sidebar - Overlaying the map */}
      <div className="absolute top-0 right-0 bottom-0">
        <RightSidebar>
          <RightSidebarHeader className="flex flex-col gap-3">
            {activeRightSidebarTab === "favorites" ? (
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
                <h2 className="text-lg font-semibold">Favorites</h2>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-sky-500" />
                <h2 className="text-lg font-semibold">Friends</h2>
              </div>
            )}

            <div className="flex w-full gap-2 rounded-2xl border border-border/60 bg-muted/30 p-1">
              {rightSidebarTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleRightSidebarTabChange(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
                    activeRightSidebarTab === tab.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={activeRightSidebarTab === tab.id}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </RightSidebarHeader>
          <RightSidebarContent>
            {activeRightSidebarTab === "favorites" ? <FavoritesList /> : <FriendsPanel />}
          </RightSidebarContent>
        </RightSidebar>
      </div>
    </div>
  );
}
