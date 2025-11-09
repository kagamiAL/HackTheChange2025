<<<<<<< HEAD
import SwipeView from "./components/swipe-view/swipe-view";
import * as React from 'react'

export default function Home() {
  return (
    <div className="max-h-screen bg-zinc-50">
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-16 text-muted-foreground">
=======
"use client";

import Map from "./components/Map";

import SwipeView from "./components/swipe-view/swipe-view";
import * as React from "react";

export default function Home() {
  return (
    <div className="h-screen w-full overflow-hidden bg-zinc-50">
      <main className="h-full w-full">
        <Map />
        <SwipeView />
>>>>>>> 6d6de089a338cba7bb78c2d60e325a732ddd4fe5
      </main>
    </div>
  );
}
