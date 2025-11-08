"use client";

import Map from "./components/Map";

export default function Home() {
  return (
    <div className="h-screen w-full overflow-hidden bg-zinc-50">
      <main className="h-full w-full">
        <Map />
      </main>
    </div>
  );
}
