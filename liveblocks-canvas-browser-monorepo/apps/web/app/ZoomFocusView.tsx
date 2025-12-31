"use client";

import { motion } from "framer-motion";
import { Tile } from "./liveblocks.config";

interface ZoomFocusViewProps {
  focusedTileId?: string;
  tiles: ReadonlyMap<string, Readonly<Tile>>;
  onTileChange: (tileId: string) => void;
}

function ZoomFocusView({
  focusedTileId,
  tiles,
  onTileChange,
}: ZoomFocusViewProps) {
  if (!focusedTileId) return null;
  const focusedTile = tiles.get(focusedTileId);
  if (!focusedTile) return null;

  const tileIds = Array.from(tiles.keys());
  const currentIndex = tileIds.indexOf(focusedTileId);
  const prevTile = tileIds[currentIndex - 1];
  const nextTile = tileIds[currentIndex + 1];

  return (
    <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-90 relative">
      {/* Blurred background */}
      <div className="absolute inset-0 blur-3xl opacity-20 pointer-events-none">
        {/* Placeholder for background image */}
      </div>

      {/* Center card */}
      <motion.div
        key={focusedTileId}
        layoutId={focusedTileId}
        className="relative z-10 w-11/12 h-4/5 bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Placeholder for content */}
        <div className="p-4">
          <h2 className="text-xl font-bold">{focusedTile.title}</h2>
          <p>Content for {focusedTile.type}</p>
        </div>
      </motion.div>

      {/* Peek left */}
      {prevTile && (
        <button
          onClick={() => onTileChange(prevTile)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-16 h-32 bg-white rounded-lg opacity-40 hover:opacity-60 transition overflow-hidden"
        >
          {/* Placeholder for preview image */}
        </button>
      )}

      {/* Peek right */}
      {nextTile && (
        <button
          onClick={() => onTileChange(nextTile)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-16 h-32 bg-white rounded-lg opacity-40 hover:opacity-60 transition overflow-hidden"
        >
          {/* Placeholder for preview image */}
        </button>
      )}
    </div>
  );
}

export { ZoomFocusView };
