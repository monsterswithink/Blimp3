"use client";

import { Tile } from "./liveblocks.config";

interface GridLayoutProps {
  tiles: ReadonlyMap<string, Readonly<Tile>>;
  zoom: number;
}

function GridLayout({ tiles, zoom }: GridLayoutProps) {
  return (
    <div className="w-full h-full p-4 bg-gray-800">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from(tiles.values()).map(tile => (
          <div key={tile.id} className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-bold">{tile.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

export { GridLayout };
