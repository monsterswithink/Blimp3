import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { LiveMap, LiveObject } from "@liveblocks/client";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

// Define the Tile and CanvasLayout interfaces, but as types for clarity
export type Tile = {
  id: string;
  title: string;
  url?: string;
  type: "document" | "webpage" | "custom";
  content?: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  groupId?: string;
  isFannedOut?: boolean;
};

export type CanvasLayout = {
  mode: "canvas" | "grid";
  zoom: number;
  focusedTileId?: string;
};

// The Storage type for the Room
type Storage = {
  tiles: LiveMap<string, LiveObject<Tile>>;
  layout: LiveObject<CanvasLayout>;
};

// The Presence type for the Room
type Presence = {
  cursor: { x: number, y: number } | null;
  editingTileId: string | null;
};

// Create a RoomContext with the defined types
export const {
  RoomProvider,
  useStorage,
  useMutation,
  useUpdateMyPresence,
  useOthers,
} = createRoomContext<Presence, Storage>(client);
