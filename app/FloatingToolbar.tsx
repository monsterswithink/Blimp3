"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BUILTIN_APPS, AppConfig } from "./app-registry";
import { AppModal } from "./AppModal";
import { useMutation } from "./liveblocks.config";
import { LiveObject } from "@liveblocks/client";
import { Tile } from "./liveblocks.config";

interface ActiveApp {
  id: string;
  instanceId: string;
  config: AppConfig;
}

function FloatingToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeApps, setActiveApps] = useState<ActiveApp[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const createNewTile = useMutation(({ storage }, type: Tile["type"]) => {
    const tiles = storage.get("tiles");
    if (tiles) {
      const newTile = {
        id: `tile-${Date.now()}`,
        title: type === "document" ? "New Document" : "New Webpage",
        type,
        x: Math.random() * 200,
        y: Math.random() * 200,
        z: (tiles.size || 0) + 1,
        width: 400,
        height: 300,
        content: type === "document" ? "" : undefined,
      };
      tiles.set(newTile.id, new LiveObject(newTile));
    }
    setIsOpen(false);
  }, []);

  const switchLayout = useMutation(({ storage }, layout: "canvas" | "grid") => {
    const currentLayout = storage.get("layout");
    if (currentLayout) {
      currentLayout.set("mode", layout);
    }
    setIsOpen(false);
  }, []);

  const commands = [
    // Tiles
    {
      id: "new-doc",
      label: "New Document",
      icon: "📄",
      category: "Tiles",
      action: () => createNewTile("document"),
    },
    {
      id: "new-webpage",
      label: "Open Webpage",
      icon: "🌐",
      category: "Tiles",
      action: () => createNewTile("webpage"),
    },

    // Apps
    ...BUILTIN_APPS.map(appConfig => ({
      id: `app-${appConfig.id}`,
      label: `Open ${appConfig.name}`,
      icon: appConfig.icon,
      category: "Apps",
      action: () => {
        setActiveApps([
          ...activeApps,
          {
            id: appConfig.id,
            instanceId: `instance-${Date.now()}`,
            config: appConfig,
          },
        ]);
      },
    })),

    // Layout
    {
      id: "layout-canvas",
      label: "Canvas Layout",
      icon: "📐",
      category: "Layout",
      action: () => switchLayout("canvas"),
    },
    {
      id: "layout-grid",
      label: "Grid Layout",
      icon: "▦",
      category: "Layout",
      action: () => switchLayout("grid"),
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = filtered.reduce(
    (acc, cmd) => {
      const cat = cmd.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(cmd);
      return acc;
    },
    {} as Record<string, typeof filtered>
  );

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-3 bg-blue-600 text-white rounded-full shadow-lg"
      >
        ⚙️
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 rounded-lg shadow-2xl w-80 overflow-hidden border border-gray-700"
        >
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commands..."
            className="w-full px-3 py-2 bg-gray-800 text-white text-sm border-b border-gray-700 focus:outline-none"
          />

          <div className="max-h-96 overflow-y-auto">
            {Object.entries(grouped).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-800">
                  {category}
                </div>

                {cmds.map((cmd) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setSearchQuery("");
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 flex items-center gap-2 transition"
                  >
                    <span>{cmd.icon}</span>
                    <span>{cmd.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="px-3 py-2 border-t border-gray-700 text-xs text-gray-500">
            Press <kbd className="bg-gray-800 px-1 rounded">⌘E</kbd> to close
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {activeApps.map((app) => (
          <AppModal
            key={app.instanceId}
            app={app}
            onClose={() =>
              setActiveApps(activeApps.filter((a) => a.instanceId !== app.instanceId))
            }
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

export { FloatingToolbar };
