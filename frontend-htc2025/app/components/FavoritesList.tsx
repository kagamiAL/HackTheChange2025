"use client";

import React, { useState } from "react";
import { Heart, Building2, Calendar, Clock, ExternalLink, ChevronDown } from "lucide-react";
import { useOpportunities } from "@/app/context/OpportunityContext";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoritesList() {
  const { favoritedOpportunities, removeFavorite } = useOpportunities();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (favoritedOpportunities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-6">
          <Heart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No favorites yet</h3>
        <p className="text-sm text-muted-foreground">
          Swipe right on opportunities to save them here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {favoritedOpportunities.map((opportunity) => {
        const isExpanded = expandedIds.has(opportunity.id);

        return (
          <div
            key={opportunity.id}
            className="group relative transition-colors hover:bg-muted/50"
          >
            {/* Collapsed Header - Always Visible */}
            <button
              onClick={() => toggleExpanded(opportunity.id)}
              className="w-full p-4 text-left flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold leading-tight line-clamp-2 pr-8">
                  {opportunity.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{opportunity.organization.name}</span>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>

            {/* Remove Button - Always Visible */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFavorite(opportunity.id);
              }}
              className="absolute right-10 top-4 rounded-full p-1.5 text-pink-500 opacity-0 transition-opacity hover:bg-pink-50 dark:hover:bg-pink-950/30 group-hover:opacity-100"
              aria-label="Remove from favorites"
            >
              <Heart className="h-4 w-4 fill-current" />
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* Image */}
                {opportunity.organization.logo && (
                  <img
                    src={opportunity.organization.logo}
                    alt={opportunity.organization.name}
                    className="w-full h-32 object-contain rounded-md bg-muted/30"
                  />
                )}

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {opportunity.description}
                </p>

                {/* Metadata Badges */}
                <div className="flex flex-wrap gap-2">
                  {opportunity.duration && (
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2 py-1 dark:bg-violet-950/30">
                      <Clock className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                      <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                        {opportunity.duration}
                      </span>
                    </div>
                  )}
                  {opportunity.dates?.start && (
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2 py-1 dark:bg-purple-950/30">
                      <Calendar className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        {new Date(opportunity.dates.start).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* View Details Link */}
                {opportunity.url && (
                  <a
                    href={opportunity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    View details
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
