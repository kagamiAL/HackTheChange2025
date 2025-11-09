"use client";

import { AppHeader } from "./app-header";
import { useFavorites } from "@/app/context/FavoritesContext";

export function AppHeaderWrapper() {
  const { favorites } = useFavorites();

  return <AppHeader savedCount={favorites.length} />;
}
