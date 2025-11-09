"use client";

import Map from "./components/Map";
import { RightSidebar, RightSidebarHeader, RightSidebarContent } from "./components/RightSidebar";
import { FavoritesList } from "./components/FavoritesList";
import { Heart } from "lucide-react";
import { OpportunityProvider } from "./context/OpportunityContext";

import SwipeView from "./components/swipe-view/swipe-view";
import * as React from "react";

export default function Home() {
  return (
    <div className="h-screen w-full overflow-hidden bg-zinc-50">
      <OpportunityProvider>
        <main className="h-full w-full">
          <div className="flex">
            <div className="z-40 w-[30vw]">
              <SwipeView />
            </div>
            <Map />
          </div>
        </main>
      </OpportunityProvider>

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
