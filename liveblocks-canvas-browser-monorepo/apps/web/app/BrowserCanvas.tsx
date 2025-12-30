"use client";

import { useStorage, useUpdateMyPresence, useMutation } from "./liveblocks.config";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FloatingToolbar } from "./FloatingToolbar";
import { CanvasLayout } from "./CanvasLayout";
import { GridLayout } from "./GridLayout";
import { ZoomFocusView } from "./ZoomFocusView";
import { Tile, CanvasLayout } from "./liveblocks.config";

export function BrowserCanvas() {
  const updatePresence = useUpdateMyPresence();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const tiles = useStorage((root) => root.tiles);
  const layout = useStorage((root) => root.layout);

  const handleZoomChange = useMutation(({ storage }, newZoom: number) => {
    const layout = storage.get("layout");
    if (layout) {
      layout.set("zoom", newZoom);
    }
  }, []);

  const handleTileDrag = useMutation(({ storage }, tileId: string, newX: number, newY: number) => {
    const tiles = storage.get("tiles");
    if (tiles) {
      const tile = tiles.get(tileId);
      if (tile) {
        tile.set("x", newX);
        tile.set("y", newY);
      }
    }
  }, []);

  const handleStackTiles = useMutation(({ storage }, draggedId: string, targetId: string) => {
    const tiles = storage.get("tiles");
    if (tiles) {
      const draggedTile = tiles.get(draggedId);
      const targetTile = tiles.get(targetId);
      if (draggedTile && targetTile) {
        const groupId = `group-${Date.now()}`;
        draggedTile.set("groupId", groupId);
        targetTile.set("groupId", groupId);
      }
    }
  }, []);

  const renderLayout = () => {
    if (!tiles || !layout) {
      return null;
    }

    if (layout.zoom === 1.0) {
      return (
        <ZoomFocusView
          focusedTileId={layout.focusedTileId}
          tiles={tiles}
          onTileChange={(tileId) => {
            // To be implemented with useMutation in the next step
          }}
        />
      );
    }

    if (layout.mode === "grid") {
      return <GridLayout zoom={layout.zoom} tiles={tiles} />;
    }

    return (
      <CanvasLayout
        tiles={tiles}
        zoom={layout?.zoom ?? 0.5}
        selectedGroup={selectedGroup}
        onTileDrag={handleTileDrag}
        onTileStack={handleStackTiles}
        onGroupSelect={setSelectedGroup}
      />
    );
  };

  return (
    <div className="h-screen w-screen bg-gray-950 overflow-hidden flex flex-col">
      <div className="flex-1 relative">
        {renderLayout()}
      </div>

      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <span className="text-xs text-gray-400">Canvas</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={layout?.zoom ?? 0.5}
          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
          className="w-24"
        />
        <span className="text-xs text-gray-400">
          {Math.round((layout?.zoom ?? 0.5) * 100)}%
        </span>
      </div>

      <FloatingToolbar />
    </div>
  );
}
