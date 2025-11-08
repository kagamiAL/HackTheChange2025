import Link from "next/link";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/app/components/ui/button";

/**
 * Renders the lightweight product header with branding and a saved counter.
 */
export type AppHeaderProps = {
  /**
   * Current number of saved items to surface beside the heart icon.
   */
  savedCount?: number;
  className?: string;
};

export function AppHeader({ savedCount = 0, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-6 border-b border-border/80 bg-white px-6 py-4 shadow-sm",
        className
      )}
    >
      <Link href="/" className="flex items-center gap-3 text-foreground">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b5cf6] via-[#a855f7] to-[#ec4899] text-white shadow">
          <Heart
            className="h-5 w-5 fill-current stroke-white/80"
            strokeWidth={1.5}
          />
        </span>
        <span className="text-lg font-semibold tracking-tight">Voluntr</span>
      </Link>

      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-muted-foreground hover:text-foreground"
        aria-label={`${savedCount} saved opportunities`}
      >
        <Heart className="h-4 w-4" strokeWidth={1.5} />
        <span className="text-sm">{savedCount} saved</span>
      </Button>
    </header>
  );
}
