"use client";

import Draggable from "react-draggable";
import { motion, AnimatePresence } from "framer-motion";
import { LiveObject } from "@liveblocks/client";
import { Tile } from "./liveblocks.config";

interface CanvasLayoutProps {
  tiles: ReadonlyMap<string, Readonly<Tile>>;
  zoom: number;
  selectedGroup: string | null;
  onTileDrag: (id: string, x: number, y: number) => void;
  onTileStack: (draggedId: string, targetId: string) => void;
  onGroupSelect: (groupId: string) => void;
}

function CanvasLayout({
  tiles,
  zoom,
  selectedGroup,
  onTileDrag,
  onTileStack,
  onGroupSelect,
}: CanvasLayoutProps) {
  const scale = 0.3 + zoom * 0.7; // scale from 0.3 to 1.0

  return (
    <div
      className="w-full h-full overflow-auto bg-gray-900"
      style={{ transformOrigin: "top left" }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <AnimatePresence>
          {Array.from(tiles.entries()).map(([id, tile]) => {
            const isGrouped = tile.groupId;
            const isInSelectedGroup = selectedGroup === tile.groupId;

            if (isGrouped && !isInSelectedGroup) {
              return null;
            }

            return (
              <Draggable
                key={id}
                defaultPosition={{ x: tile.x, y: tile.y }}
                onDrag={(e, { x, y }) => onTileDrag(id, x, y)}
                onStop={(e, { x, y }) => onTileDrag(id, x, y)}
              >
                <motion.div
                  layoutId={id}
                  className="absolute cursor-grab active:cursor-grabbing"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <TileCard
                    tile={tile}
                    onStack={() => onTileStack(id, "")}
                    onGroupTap={() => onGroupSelect(tile.groupId!)}
                    isInSelectedGroup={isInSelectedGroup}
                  />
                </motion.div>
              </Draggable>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TileCard({
  tile,
  onStack,
  onGroupTap,
  isInSelectedGroup,
}: {
  tile: Readonly<Tile>;
  onStack: () => void;
  onGroupTap: () => void;
  isInSelectedGroup: boolean;
}) {
  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg overflow-hidden"
      style={{ width: tile.width, height: tile.height }}
      whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)" }}
      onTap={tile.groupId ? onGroupTap : undefined}
    >
      <div className="w-full h-full flex flex-col">
        <div className="bg-gray-100 px-3 py-2 border-b flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-800">{tile.title}</h3>
          <div className="text-xs text-gray-500">
            {tile.groupId ? "📌 Grouped" : ""}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {/* Placeholder for content */}
          <div className="p-4">
            <p className="text-gray-600">Content for {tile.type}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { CanvasLayout };
