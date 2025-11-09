"use client";

import Map from "./components/Map";
import { RightSidebar, RightSidebarHeader, RightSidebarContent } from "./components/RightSidebar";
import { FavoritesList } from "./components/FavoritesList";
import { Heart } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full h-full overflow-hidden bg-zinc-50 relative">
      {/* Main Map Area */}
      <main className="w-full h-full">
        <Map />
      </main>

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
