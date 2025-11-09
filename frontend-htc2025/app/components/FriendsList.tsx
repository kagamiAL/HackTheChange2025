"use client";

import { RefreshCw, Users2, Loader2 } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import type { Friend } from "@/app/types/friend";

export type FriendsStatus = "idle" | "loading" | "success" | "error";

interface FriendsListProps {
  status: FriendsStatus;
  friends: Friend[];
  errorMessage?: string | null;
  isNewUser?: boolean;
  onRetry: () => void;
}

export function FriendsList({
  status,
  friends,
  errorMessage,
  isNewUser,
  onRetry,
}: FriendsListProps) {
  const isLoading = status === "loading" || status === "idle";
  const hasFriends = status === "success" && friends.length > 0;
  const showEmptyState = status === "success" && friends.length === 0;

  return (
    <div className="flex flex-1 flex-col rounded-2xl border bg-card/70 shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Friends</p>
          <h3 className="text-base font-semibold">
            {friends.length ? `${friends.length} connected` : "No friends yet"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground"
            onClick={onRetry}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {status === "error" ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-8 text-center text-sm">
            <p className="text-destructive">{errorMessage ?? "Unable to load friends."}</p>
            <Button type="button" size="sm" variant="outline" onClick={onRetry} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <Users2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isNewUser
                ? "Welcome aboard! Once friends accept your invites, they will show up here."
                : "Looks like your friends list is empty. Invite teammates to get started."}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={onRetry} disabled={isLoading}>
              Refresh
            </Button>
          </div>
        ) : null}

        {hasFriends ? (
          <ul className="divide-y">
            {friends.map((friend) => {
              const name = friend.full_name?.trim() || friend.email;
              return (
                <li key={friend.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{friend.email}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      friend.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {friend.is_active ? "Active" : "Inactive"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

        {isLoading ? (
          <div className="space-y-3 px-4 py-6 text-sm text-muted-foreground">
            {[0, 1, 2].map((index) => (
              <div key={index} className="animate-pulse rounded-lg border bg-muted/40 px-4 py-3">
                Loading friend…
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
