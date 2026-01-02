"use client";

import { LiveblocksProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { RoomProvider } from "./liveblocks.config";
import { LiveMap, LiveObject } from "@liveblocks/client";
import { ReactNode } from "react";

function LoadingScreen() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="animate-spin text-2xl">⚙️</div>
    </div>
  );
}

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}>
      <RoomProvider
        id="browser-canvas"
        initialStorage={{
          tiles: new LiveMap(),
          layout: new LiveObject({ mode: "canvas", zoom: 0.5 }),
        }}
        initialPresence={{
          cursor: null,
          editingTileId: null,
        }}
      >
        <ClientSideSuspense fallback={<LoadingScreen />}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
