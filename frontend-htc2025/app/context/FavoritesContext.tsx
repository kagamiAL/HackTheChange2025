"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";

import { backendBaseUrl, useAuth } from "@/app/context/AuthContext";
import { VolunteerOpportunity } from "./OpportunityContext";

interface FavoritesContextType {
  favorites: VolunteerOpportunity[];
  addFavorite: (opportunity: VolunteerOpportunity) => void;
  removeFavorite: (opportunityId: number) => void;
  isFavorite: (opportunityId: number) => boolean;
  toggleFavorite: (opportunity: VolunteerOpportunity) => void;
  reloadFavorites: () => void;
  isFetchingFavorites: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface SavedOpportunityPayload {
  id: number;
  api_id?: number | null;
  title: string;
  description: string;
  url: string;
  organization: string;
  organization_logo: string | null;
  dates?: string | null;
  duration?: string | null;
}

interface SavedOpportunitiesResponse {
  opportunities: SavedOpportunityPayload | SavedOpportunityPayload[] | null;
}

async function extractMessageFromResponse(response: Response, fallback: string) {
  try {
    const data = await response.clone().json();
    if (typeof (data as { message?: string })?.message === "string") {
      return data.message;
    }
  } catch {
    // ignore json parse errors
  }

  try {
    const text = await response.text();
    if (text) {
      return text;
    }
  } catch {
    // ignore text parse errors
  }

  return fallback;
}

function parseDatesRange(value?: string | null): { start: string; end: string } {
  if (!value?.trim()) {
    return { start: "", end: "" };
  }

  const parts = value.split(/\s+[-–]\s+/).map((part) => part.trim());
  if (parts.length >= 2) {
    return { start: parts[0], end: parts[1] };
  }

  return { start: value.trim(), end: value.trim() };
}

function mapSavedOpportunityToVolunteerOpportunity(
  saved: SavedOpportunityPayload,
): VolunteerOpportunity {
  const dates = parseDatesRange(saved.dates);
  return {
    id: saved.api_id ?? saved.id,
    title: saved.title,
    description: saved.description,
    remote_or_online: false,
    organization: {
      name: saved.organization,
      logo: saved.organization_logo,
    },
    audience: {
      scope: "All volunteers",
    },
    dates,
    duration: saved.duration ?? "",
    url: saved.url,
  };
}

async function fetchSavedOpportunities(user: User): Promise<VolunteerOpportunity[]> {
  if (!backendBaseUrl) {
    throw new Error("BACKEND_API_URL is not configured.");
  }

  const idToken = await user.getIdToken();
  const response = await fetch(`${backendBaseUrl}/opportunities/saved`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const message = await extractMessageFromResponse(
      response,
      "Unable to load saved opportunities.",
    );
    throw new Error(message);
  }

  const data = (await response.json()) as SavedOpportunitiesResponse;
  const saved = data?.opportunities;
  if (!saved) {
    return [];
  }

  const list = Array.isArray(saved) ? saved : [saved];
  return list.map(mapSavedOpportunityToVolunteerOpportunity);
}

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user, backendAuth, hasBackendConfigured } = useAuth();
  const [localFavorites, setLocalFavorites] = useState<VolunteerOpportunity[]>([]);
  const [remoteFavorites, setRemoteFavorites] = useState<VolunteerOpportunity[] | null>(null);
  const [remoteFetchKey, setRemoteFetchKey] = useState(0);
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);

  const isRemoteSession = Boolean(user && backendAuth && hasBackendConfigured);
  const usingRemoteData = isRemoteSession && remoteFavorites !== null;
  const favorites = usingRemoteData ? remoteFavorites! : localFavorites;
  const reloadFavorites = useCallback(() => {
    if (!isRemoteSession || !user || !backendAuth) {
      return;
    }
    setRemoteFetchKey((previous) => previous + 1);
  }, [backendAuth, isRemoteSession, user]);

  useEffect(() => {
    if (!isRemoteSession || !user || !backendAuth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemoteFavorites(null);
      setIsFetchingRemote(false);
      return;
    }

    let isMounted = true;
    setRemoteFavorites(null);
    setIsFetchingRemote(true);

    console.debug(
      "FavoritesContext: fetching saved opportunities",
      backendAuth?.user?.id,
      { reloadKey: remoteFetchKey },
    );

    fetchSavedOpportunities(user)
      .then((saved) => {
        if (!isMounted) {
          return;
        }
        setRemoteFavorites(saved);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        console.error("Failed to load saved opportunities", error);
        setRemoteFavorites(null);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }
        setIsFetchingRemote(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    backendAuth,
    backendAuth?.user.id,
    hasBackendConfigured,
    isRemoteSession,
    remoteFetchKey,
    user,
  ]);

  const updateFavoritesState = (
    updater: (prev: VolunteerOpportunity[]) => VolunteerOpportunity[],
  ) => {
    if (usingRemoteData) {
      setRemoteFavorites((prev) => updater(prev ?? []));
    } else {
      setLocalFavorites(updater);
    }
  };

  const addFavorite = (opportunity: VolunteerOpportunity) => {
    updateFavoritesState((prev) => {
      if (prev.some((fav) => fav.id === opportunity.id)) {
        return prev;
      }
      return [...prev, opportunity];
    });
  };

  const removeFavorite = (opportunityId: number) => {
    updateFavoritesState((prev) => prev.filter((fav) => fav.id !== opportunityId));
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
        reloadFavorites,
        isFetchingFavorites: isRemoteSession ? isFetchingRemote : false,
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
