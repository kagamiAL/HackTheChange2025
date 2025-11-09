"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { VolunteerOpportunity } from "./OpportunityContext";

interface FavoritesContextType {
  favorites: VolunteerOpportunity[];
  addFavorite: (opportunity: VolunteerOpportunity) => void;
  removeFavorite: (opportunityId: number) => void;
  isFavorite: (opportunityId: number) => boolean;
  toggleFavorite: (opportunity: VolunteerOpportunity) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<VolunteerOpportunity[]>([]);

  const addFavorite = (opportunity: VolunteerOpportunity) => {
    setFavorites((prev) => {
      // Avoid duplicates
      if (prev.some((fav) => fav.id === opportunity.id)) {
        return prev;
      }
      return [...prev, opportunity];
    });
  };

  const removeFavorite = (opportunityId: number) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== opportunityId));
  };

  const isFavorite = (opportunityId: number) => {
    return favorites.some((fav) => fav.id === opportunityId);
  };

  const toggleFavorite = (opportunity: VolunteerOpportunity) => {
    if (isFavorite(opportunity.id)) {
      removeFavorite(opportunity.id);
    } else {
      addFavorite(opportunity);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
