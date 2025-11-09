"use client";

import Map from "./components/Map";
import { RightSidebar, RightSidebarHeader, RightSidebarContent } from "./components/RightSidebar";
import { LeftSidebar, LeftSidebarHeader, LeftSidebarContent } from "./components/LeftSidebar";
import { FavoritesList } from "./components/FavoritesList";
import SwipeView from "./components/SwipeView";
import { Heart, Sparkles, MapPin } from "lucide-react";
import { useOpportunities } from "./context/OpportunityContext";

export default function Home() {
  const { hideRemoteOpportunities, setHideRemoteOpportunities } = useOpportunities();

  return (
    <div className="w-full h-full overflow-hidden bg-zinc-50 relative">
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
          <RightSidebarHeader>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500 fill-pink-500" />
              <h2 className="text-lg font-semibold">Favorites</h2>
            </div>
          </RightSidebarHeader>
          <RightSidebarContent>
            <FavoritesList />
          </RightSidebarContent>
        </RightSidebar>
      </div>
    </div>
  );
}
