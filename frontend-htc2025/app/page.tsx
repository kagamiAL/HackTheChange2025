import SwipeView from "./components/swipe-view/swipe-view";
import * as React from 'react'

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-16 text-muted-foreground">
        <p>Code here!</p>
        <SwipeView />
      </main>
    </div>
  );
}
