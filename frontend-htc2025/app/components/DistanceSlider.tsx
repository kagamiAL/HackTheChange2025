"use client";

import { useOpportunities } from "@/app/context/OpportunityContext";

export default function DistanceSlider() {
  const { maxDistance, setMaxDistance } = useOpportunities();

  return (
    <div className="w-full px-4 py-3 border-b border-border bg-background">
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="distance-slider" className="text-sm font-medium text-foreground">
          Search Radius
        </label>
        <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
          {maxDistance} km
        </span>
      </div>
      <input
        id="distance-slider"
        type="range"
        min="5"
        max="100"
        step="5"
        value={maxDistance}
        onChange={(e) => setMaxDistance(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-violet-600"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>5 km</span>
        <span>100 km</span>
      </div>
    </div>
  );
}
