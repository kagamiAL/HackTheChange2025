"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface VolunteerOpportunity {
  id: number;
  title: string;
  description: string;
  remote_or_online: boolean;
  organization: {
    name: string;
    logo: string | null;
  };
  audience: {
    scope: string;
    longitude?: number;
    latitude?: number;
  };
  dates: {
    start: string;
    end: string;
  };
  duration: string;
  url: string;
}

interface OpportunityContextType {
  opportunities: VolunteerOpportunity[];
  setOpportunities: (opportunities: VolunteerOpportunity[]) => void;
  selectedOpportunity: VolunteerOpportunity | null;
  setSelectedOpportunity: (opportunity: VolunteerOpportunity | null) => void;
  hideRemoteOpportunities: boolean;
  setHideRemoteOpportunities: (hide: boolean) => void;
  favoritedOpportunities: VolunteerOpportunity[];
  addFavorite: (opportunity: VolunteerOpportunity) => void;
  removeFavorite: (opportunityId: number) => void;
  isFavorited: (opportunityId: number) => boolean;
  maxDistance: number;
  setMaxDistance: (distance: number) => void;
}

const OpportunityContext = createContext<OpportunityContextType | undefined>(undefined);

export const OpportunityProvider = ({ children }: { children: ReactNode }) => {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<VolunteerOpportunity | null>(null);
  const [hideRemoteOpportunities, setHideRemoteOpportunities] = useState(false);
  const [favoritedOpportunities, setFavoritedOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [maxDistance, setMaxDistance] = useState(25); // Default 25km

  const addFavorite = (opportunity: VolunteerOpportunity) => {
    setFavoritedOpportunities(prev => {
      // Check if already favorited
      if (prev.some(fav => fav.id === opportunity.id)) {
        return prev;
      }
      return [...prev, opportunity];
    });
  };

  const removeFavorite = (opportunityId: number) => {
    setFavoritedOpportunities(prev => prev.filter(fav => fav.id !== opportunityId));
  };

  const isFavorited = (opportunityId: number) => {
    return favoritedOpportunities.some(fav => fav.id === opportunityId);
  };

  return (
    <OpportunityContext.Provider
      value={{
        opportunities,
        setOpportunities,
        selectedOpportunity,
        setSelectedOpportunity,
        hideRemoteOpportunities,
        setHideRemoteOpportunities,
        favoritedOpportunities,
        addFavorite,
        removeFavorite,
        isFavorited,
        maxDistance,
        setMaxDistance,
      }}
    >
      {children}
    </OpportunityContext.Provider>
  );
};

export const useOpportunities = () => {
  const context = useContext(OpportunityContext);
  if (context === undefined) {
    throw new Error("useOpportunities must be used within an OpportunityProvider");
  }
  return context;
};

export type { VolunteerOpportunity };
