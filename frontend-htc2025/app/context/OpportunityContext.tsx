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
}

const OpportunityContext = createContext<OpportunityContextType | undefined>(undefined);

export const OpportunityProvider = ({ children }: { children: ReactNode }) => {
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<VolunteerOpportunity | null>(null);

  return (
    <OpportunityContext.Provider
      value={{
        opportunities,
        setOpportunities,
        selectedOpportunity,
        setSelectedOpportunity,
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
