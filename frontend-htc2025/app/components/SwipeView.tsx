"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { useOpportunities } from "@/app/context/OpportunityContext";
import { useFavorites } from "@/app/context/FavoritesContext";

export default function SwipeView() {
  const { opportunities, selectedOpportunity, setSelectedOpportunity, hideRemoteOpportunities } = useOpportunities();
  const { addFavorite } = useFavorites();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [animateDirection, setAnimateDirection] = useState<'left' | 'right' | null>(null);
  const startXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const lastSelectedIdRef = useRef<number | null>(null);

  // Filter opportunities based on hideRemoteOpportunities setting
  const filteredOpportunities = React.useMemo(() => {
    if (!hideRemoteOpportunities) {
      return opportunities;
    }
    // Only show opportunities that have markers on the map:
    // - NOT remote/online
    // - AND have valid coordinates
    return opportunities.filter(opp => {
      const hasCoordinates =
        !opp.remote_or_online &&
        opp.audience?.latitude !== undefined &&
        opp.audience?.longitude !== undefined;
      return hasCoordinates;
    });
  }, [opportunities, hideRemoteOpportunities]);

  // Sync currentIndex when selectedOpportunity changes externally (from map)
  React.useEffect(() => {
    if (selectedOpportunity && filteredOpportunities.length > 0) {
      const selectedId = selectedOpportunity.id;

      // Only update if this is a new selection from outside (e.g., map click)
      if (selectedId !== lastSelectedIdRef.current) {
        const index = filteredOpportunities.findIndex(opp => opp.id === selectedId);
        if (index !== -1) {
          setCurrentIndex(index);
          lastSelectedIdRef.current = selectedId;
          // Reset animation states
          setDragOffset(0);
          setIsDragging(false);
          setIsAnimatingOut(false);
          setAnimateDirection(null);
        }
      }
    }
  }, [selectedOpportunity, filteredOpportunities]);

  // Sync selectedOpportunity when currentIndex changes (from swipe)
  React.useEffect(() => {
    if (filteredOpportunities.length > 0) {
      const currentOpportunity = filteredOpportunities[currentIndex];
      if (currentOpportunity) {
        const currentId = currentOpportunity.id;

        // Only update if we've moved to a different card
        if (currentId !== lastSelectedIdRef.current) {
          lastSelectedIdRef.current = currentId;
          setSelectedOpportunity(currentOpportunity);
        }
      }
    }
  }, [currentIndex, filteredOpportunities, setSelectedOpportunity]);

  // Reset currentIndex when filter changes
  React.useEffect(() => {
    setCurrentIndex(0);
  }, [hideRemoteOpportunities]);

  // Don't render if no opportunities
  if (!filteredOpportunities || filteredOpportunities.length === 0) {
    return null;
  }

  const currentOpportunity = filteredOpportunities[currentIndex];

  // Safety check: ensure currentOpportunity exists and has required data
  if (!currentOpportunity || !currentOpportunity.organization || !currentOpportunity.audience) {
    return null;
  }

  const animateCardOut = (direction: 'left' | 'right', callback: () => void) => {
    setIsAnimatingOut(true);
    setAnimateDirection(direction);

    // Wait for animation to complete, then reset and move to next card
    setTimeout(() => {
      callback();
      setIsAnimatingOut(false);
      setAnimateDirection(null);
      setDragOffset(0); // Reset drag offset
      setIsDragging(false); // Reset dragging state
    }, 300); // Match animation duration
  };

  const handleSkip = () => {
    if (currentIndex < filteredOpportunities.length - 1) {
      animateCardOut('left', () => {
        setCurrentIndex(currentIndex + 1);
      });
    }
  };

  const handleSave = () => {
    // Add to favorites
    addFavorite(currentOpportunity);

    if (currentIndex < filteredOpportunities.length - 1) {
      animateCardOut('right', () => {
        setCurrentIndex(currentIndex + 1);
      });
    }
  };

  // Touch event handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const threshold = 50; // pixels to trigger swipe (reduced for limited space)

    if (dragOffset > threshold) {
      // Swipe right - save
      handleSave();
    } else if (dragOffset < -threshold) {
      // Swipe left - skip
      handleSkip();
    } else {
      // Return to center if threshold not met
      setDragOffset(0);
    }
  };

  // Mouse event handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startXRef.current;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const threshold = 50;

    if (dragOffset > threshold) {
      handleSave();
    } else if (dragOffset < -threshold) {
      handleSkip();
    } else {
      setDragOffset(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Calculate transform based on drag or exit animation
  let transform = 'scale(1)';
  let cardOpacity = 1;

  if (isAnimatingOut && animateDirection) {
    // Slide out animation
    const slideDistance = animateDirection === 'left' ? -400 : 400;
    transform = `translateX(${slideDistance}px) scale(0.8)`;
    cardOpacity = 0;
  } else if (isDragging) {
    // Dragging animation - subtle scale
    const scale = Math.max(0.95, 1 - Math.abs(dragOffset) / 800);
    cardOpacity = Math.max(0.7, 1 - Math.abs(dragOffset) / 300);
    transform = `scale(${scale})`;
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 relative">
      <div
        ref={cardRef}
        className="max-w-md w-full h-full bg-white rounded-xl shadow-lg flex flex-col cursor-grab active:cursor-grabbing select-none relative"
        style={{
          transform: transform,
          opacity: cardOpacity,
          transition: isAnimatingOut
            ? "transform 0.3s ease-in, opacity 0.3s ease-in"
            : isDragging
            ? "none"
            : "transform 0.2s ease-out, opacity 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Swipe indicators - color overlay only */}
        {(dragOffset > 30 || (isAnimatingOut && animateDirection === 'right')) && (
          <div className="absolute inset-0 bg-green-500/20 z-10 pointer-events-none rounded-xl"></div>
        )}
        {(dragOffset < -30 || (isAnimatingOut && animateDirection === 'left')) && (
          <div className="absolute inset-0 bg-red-500/20 z-10 pointer-events-none rounded-xl"></div>
        )}
        <img
          src={currentOpportunity.organization?.logo || "/placeholder-event.jpg"}
          alt="Event Image"
          className="w-full h-40 sm:h-48 md:h-56 object-contain bg-gray-50 pointer-events-none"
        />
        <div className="p-4 sm:p-6 flex-1 flex flex-col min-h-0">
          <span className="bg-gray-200 text-gray-900 text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1 rounded-full inline-block w-fit flex-shrink-0">
            {currentOpportunity.organization?.name || 'Unknown Organization'}
          </span>

          <h2 className="mt-2 sm:mt-3 text-xl sm:text-2xl font-semibold text-gray-900 line-clamp-2 flex-shrink-0">
            {currentOpportunity.title || 'Untitled Opportunity'}
          </h2>

          <div className="overflow-y-auto flex-1 min-h-0 w-full">
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-700 leading-relaxed">
              {currentOpportunity.description || 'No description available'}
            </p>

            <div className="mt-3 sm:mt-4 flex flex-col text-gray-500 text-xs sm:text-sm">
              {currentOpportunity.audience?.scope && (
                <div className="flex items-center space-x-1 mt-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{currentOpportunity.audience.scope}</span>
                </div>
              )}

              {currentOpportunity.dates?.start && (
                <div className="flex items-center space-x-1 mt-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{formatDate(currentOpportunity.dates.start)}</span>
                </div>
              )}

              {currentOpportunity.duration && (
                <div className="flex items-center space-x-1 mt-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{currentOpportunity.duration}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex-shrink-0">
            <div className="flex items-center justify-center space-x-4 sm:space-x-6 mb-2 sm:mb-3">
              <button
                onClick={handleSkip}
                className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-red-200 text-red-500
                      transform transition duration-200 ease-in-out hover:scale-110 active:scale-95 hover:bg-red-50 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="skip"
                disabled={currentIndex >= filteredOpportunities.length - 1}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full
                      border-2 border-green-300 bg-white
                      transform transition duration-200 ease-in-out hover:scale-110 active:scale-95 focus:outline-none cursor-pointer hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="save"
                disabled={currentIndex >= filteredOpportunities.length - 1}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="rgb(34 197 94)"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </button>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm text-center">
              Swipe left to skip • Swipe right to save
            </p>
            <p className="text-gray-400 text-xs text-center mt-1 sm:mt-2">
              {currentIndex + 1} of {filteredOpportunities.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
