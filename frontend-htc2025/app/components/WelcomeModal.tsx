"use client";

import { useEffect, useState } from "react";
import { Heart, MapPin, Hand, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/app/components/ui/button";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem("hasVisitedVoluntr");
    if (!hasVisited) {
      setIsOpen(true);
    }
  }, []);

  const handleContinue = () => {
    // Mark as visited
    localStorage.setItem("hasVisitedVoluntr", "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5cf6] via-[#a855f7] to-[#ec4899] text-white shadow-lg">
              <Heart className="h-8 w-8 fill-current stroke-white/80" strokeWidth={1.5} />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Welcome to Voluntr!</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Discover volunteer opportunities in your community with an interactive map and swipe
            experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center">
              <Search className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Search Your Location</h3>
              <p className="text-sm text-muted-foreground">
                Enter your address or postal code to find volunteer opportunities near you.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Explore the Map</h3>
              <p className="text-sm text-muted-foreground">
                Click on markers to view opportunities, or browse the interactive 3D map to discover
                what's nearby.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-950/30 flex items-center justify-center">
              <Hand className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Swipe Through Opportunities</h3>
              <p className="text-sm text-muted-foreground">
                Use the swipe view on the left to browse opportunities. Swipe right or tap the
                checkmark to save favorites, swipe left to skip.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
              <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Save & Apply</h3>
              <p className="text-sm text-muted-foreground">
                Access your saved opportunities anytime from the community sidebar on the right.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
