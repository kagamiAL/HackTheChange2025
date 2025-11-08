"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

interface LocationResult {
  id: string;
  place_name: string;
  center: [number, number];
}

interface LocationSearchProps {
  onLocationSelect: (longitude: number, latitude: number, placeName: string) => void;
}

const LocationSearch = ({ onLocationSelect }: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchLocations = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${accessToken}&limit=5`
        );
        const data = await response.json();
        setResults(data.features || []);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching locations:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchLocations, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectLocation = (result: LocationResult) => {
    const [longitude, latitude] = result.center;
    onLocationSelect(longitude, latitude, result.place_name);
    setQuery(result.place_name);
    setShowResults(false);
  };

  return (
    <div
      ref={searchRef}
      className="absolute top-4 left-4 z-10 w-80"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for a location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          className="pl-10 bg-white shadow-lg"
        />
      </div>

      {showResults && results.length > 0 && (
        <Card className="mt-2 max-h-64 overflow-y-auto bg-white shadow-lg">
          <div className="divide-y">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleSelectLocation(result)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-100 transition-colors"
              >
                {result.place_name}
              </button>
            ))}
          </div>
        </Card>
      )}

      {isLoading && (
        <Card className="mt-2 bg-white shadow-lg">
          <div className="px-4 py-3 text-sm text-muted-foreground">
            Searching...
          </div>
        </Card>
      )}
    </div>
  );
};

export default LocationSearch;
