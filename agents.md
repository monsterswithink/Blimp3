i want to use liveblocks to create a freely draggable canvas that has pages or docs i can move around, stack together, like card stacks/groups, and also allow this canvas to be able to load a fully custom component such as a webpage (but not as an ifrsme, something super native feeling like a real browser tab). I wanna use liveblockd9s react and tiptap
---

I'll gather information about building this type of collaborative canvas application with Liveblocks.

Searched How to build a collaborative draggable canvas with Liveblocks React for organizing pages and documents
Searched Liveblocks React state management for canvas positioning and document organization
Searched Loading custom components and webpages in Liveblocks collaborative applications
You're describing an ambitious collaborative canvas application! Here's how to approach building this with Liveblocks and Tiptap:

Architecture overview
Your setup will use:

Storage - to persist canvas pages/docs, their positions, and metadata
Presence - to track user interactions (current page being edited, cursor position)
Tiptap - for collaborative text editing within each page
Custom React components - rendered natively on the canvas instead of iframes
Canvas page structure
Store your canvas pages in Liveblocks storage as an object map:
```
import { useStorage, useUpdateMyPresence } from "@liveblocks/react/suspense";

interface CanvasPage {
  id: string;
  title: string;
  x: number; // position
  y: number;
  z: number; // stacking order
  width: number;
  height: number;
  type: "document" | "custom"; // what content it holds
  content?: string; // for tiptap docs
  componentType?: string; // e.g., "webpage", "form", etc
}

function Canvas() {
  const { pages } = useStorage();
  const updatePresence = useUpdateMyPresence();

  const handleDragPage = (pageId: string, newX: number, newY: number) => {
    // Update position in storage
    pages?.[pageId]?.update({
      x: newX,
      y: newY,
    });

    // Optionally track current interaction
    updatePresence({
      editingPageId: pageId,
      cursorPosition: { x: newX, y: newY },
    });
  };

  return (
    <div className="canvas overflow-auto w-full h-full bg-gray-50">
      {pages && Object.entries(pages).map(([id, page]) => (
        <Draggable
          key={id}
          defaultPosition={{ x: page.x, y: page.y }}
          onDrag={(e, d) => handleDragPage(id, d.x, d.y)}
        >
          {/* +++  Render page with the correct component +++  */}
          <PageRenderer page={page} />
        </Draggable>
      ))}
    </div>
  );
}
```
Custom component rendering (no iframe)
Instead of iframes, render custom components directly:
```
function PageRenderer({ page }: { page: CanvasPage }) {
  switch (page.type) {
    case "document":
      return <TiptapPageEditor pageId={page.id} />;

    case "custom":
      return (
        <CustomComponentRenderer
          componentType={page.componentType}
          pageId={page.id}
        />
      );

    default:
      return null;
  }
}

function CustomComponentRenderer({
  componentType,
  pageId,
}: {
  componentType?: string;
  pageId: string;
}) {
  // Dynamically load and render custom components
  const componentMap: Record<string, React.ComponentType<any>> = {
    webpage: WebpageViewer,
    form: FormComponent,
    chart: ChartComponent,
    // map your custom components here
  };

  const Component = componentType ? componentMap[componentType] : null;
  return Component ? <Component pageId={pageId} /> : null;
}
```
Tiptap document pages
Use Liveblocks Tiptap integration for document pages:
```
import { useCreateTiptapBinding } from "@liveblocks/react-tiptap";
import { useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";

function TiptapPageEditor({ pageId }: { pageId: string }) {
  const { pages } = useStorage();
  const page = pages?.[pageId];

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class: "prose p-4",
      },
    },
  });

  useCreateTiptapBinding({
    editor,
    field: page,
  });

  return <div>{editor && <EditorContent editor={editor} />}</div>;
}
```
Stacking and grouping
To handle page stacking and grouping, add metadata to your storage structure:
```
interface CanvasPage {
  // ... existing properties
  groupId?: string; // for card stacks
  zIndex: number; // for layering
}

// When dragging a page onto another, create a group:
const handleStackPages = (targetPageId: string, sourcePageId: string) => {
  const groupId = `group-${Date.now()}`;
  pages?.[targetPageId]?.update({ groupId });
  pages?.[sourcePageId]?.update({ groupId });
};
```
Key considerations
Dragging library: Use react-beautiful-dnd or react-grid-layout for the canvas drag behavior
Rendering performance: Consider virtualization for many pages using react-window
Custom components: Build as React components that accept a pageId prop to sync with Liveblocks storage
Presence tracking: Use useOthers to show other users' cursor positions and active pages
Would you like me to help you with specific parts, like setting up the Tiptap integration, handling drag-and-drop, or building a specific custom component?
---

yes! I'm actually trying to build a fully browser using just liveblocks (LB) they can showcase as a spotlight example. The idea of tabs is broken today; a forgotten thing once its opened. The canvas will handle all the tabs (tiles) but in different layouts--all as tiles or LB style docs/cards where one layout is an open canvas of freely draggable tiles can be moved around or dragged and dropped on top of each other to create this sort of fanning out style grouping, which when tapped will fan out into a grid via a blurred bg styoe modal. And the other layout is just a grid variant that is more like a bemto box with diff heights and widths. This will be controlled via a zoom (0-1.0) slider that once it reaches 1.0 it centers the last opened tab at full height but in a rounded card still where a peacaboo of both neighboring left and right tiles can be clicked on like a slideshow, pushing that tile into center. Then zoom out to see more tiles and so on. 

Big thing is I want to use the slash command component nested inside a fixed footer FloatingToolbar for quickly accessing all actions via cmd+e for desktop and icon button on mobile everything being controlled. 
---
Searched Liveblocks storage, presence, and real-time synchronization for complex UI state
This is a brilliant concept—a spotlight example for Liveblocks! A browser reimagined as a collaborative canvas with adaptive layouts. Let me break down the architecture:

Core data structure
Store tabs as tiles with position, content, and metadata:
```

interface Tile {
  id: string;
  title: string;
  url?: string; // for web content
  type: "document" | "webpage" | "custom";
  content?: string; // tiptap editor state
  
  // Canvas state
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  
  // Grouping
  groupId?: string;
  isFannedOut?: boolean;
}

interface CanvasLayout {
  mode: "canvas" | "grid"; // layout variant
  zoom: number; // 0-1.0
  focusedTileId?: string; // for zoom 1.0
}
```
Main canvas component
```
import { useStorage, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function BrowserCanvas() {
  const { tiles, layout } = useStorage();
  const updatePresence = useUpdateMyPresence();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const handleZoomChange = (newZoom: number) => {
    layout?.update({ zoom: newZoom });

    if (newZoom === 1.0 && tiles) {
      // Center last opened tile
      const lastTile = Object.values(tiles).sort(
        (a, b) => (b.z ?? 0) - (a.z ?? 0)
      )[0];
      
      layout?.update({ focusedTileId: lastTile?.id });
    }
  };

  const handleTileDrag = (tileId: string, newX: number, newY: number) => {
    tiles?.[tileId]?.update({ x: newX, y: newY });
    updatePresence({ draggingTileId: tileId });
  };

  const handleStackTiles = (draggedId: string, targetId: string) => {
    const groupId = `group-${Date.now()}`;
    tiles?.[draggedId]?.update({ groupId });
    tiles?.[targetId]?.update({ groupId });
  };

  const renderLayout = () => {
    if (layout?.zoom === 1.0) {
      return (
        <ZoomFocusView
          focusedTileId={layout.focusedTileId}
          tiles={tiles}
          onTileChange={(tileId) =>
            layout?.update({ focusedTileId: tileId })
          }
        />
      );
    }

    if (layout?.mode === "grid") {
      return (
        <GridLayout zoom={layout.zoom} tiles={tiles} />
      );
    }

    // Canvas (freeform draggable) mode
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
      {/* +++  Canvas area +++  */}
      <div className="flex-1 relative">
        {renderLayout()}
      </div>

      {/* +++  Zoom slider +++  */}
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

      {/* +++  FloatingToolbar with Slash Commands +++  */}
      <FloatingToolbar />
    </div>
  );
}
```
Freeform canvas layout
```
import Draggable from "react-draggable";

interface CanvasLayoutProps {
  tiles: Record<string, Tile>;
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
          {Object.entries(tiles).map(([id, tile]) => {
            const isGrouped = tile.groupId;
            const isInSelectedGroup = selectedGroup === tile.groupId;

            // +++  Skip rendering if in unselected group  +++
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
                  {/* +++  Tile card +++  */}
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
  tile: Tile;
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
        {/* +++  Title bar +++  */}
        <div className="bg-gray-100 px-3 py-2 border-b flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-800">{tile.title}</h3>
          <div className="text-xs text-gray-500">
            {tile.groupId ? "📌 Grouped" : ""}
          </div>
        </div>

        {/* +++  Content +++  */}
        <div className="flex-1 overflow-auto">
          {tile.type === "document" && (
            <TiptapPreview tileId={tile.id} content={tile.content} />
          )}
          {tile.type === "webpage" && (
            <WebpageViewer url={tile.url} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
```
Zoom 1.0 focus view (slideshow style)
```
function ZoomFocusView({
  focusedTileId,
  tiles,
  onTileChange,
}: {
  focusedTileId?: string;
  tiles: Record<string, Tile>;
  onTileChange: (tileId: string) => void;
}) {
  const focusedTile = focusedTileId && tiles[focusedTileId];
  if (!focusedTile) return null;

  const tileIds = Object.keys(tiles);
  const currentIndex = tileIds.indexOf(focusedTileId);
  const prevTile = tileIds[currentIndex - 1];
  const nextTile = tileIds[currentIndex + 1];

  return (
    <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-90 relative">
      {/* +++  Blurred background +++  */}
      <div className="absolute inset-0 blur-3xl opacity-20 pointer-events-none">
        <img
          src={focusedTile.url}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* +++  Center card +++  */}
      <motion.div
        key={focusedTileId}
        layoutId={focusedTileId}
        className="relative z-10 w-11/12 h-4/5 bg-white rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {focusedTile.type === "webpage" ? (
          <WebpageViewer url={focusedTile.url} />
        ) : (
          <TiptapFullEditor tileId={focusedTileId} />
        )}
      </motion.div>

      {/* +++  Peek left +++  */}
      {prevTile && (
        <button
          onClick={() => onTileChange(prevTile)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-16 h-32 bg-white rounded-lg opacity-40 hover:opacity-60 transition overflow-hidden"
        >
          <img
            src={tiles[prevTile].url}
            alt="Previous"
            className="w-full h-full object-cover"
          />
        </button>
      )}

      {/* +++  Peek right +++  */}
      {nextTile && (
        <button
          onClick={() => onTileChange(nextTile)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-16 h-32 bg-white rounded-lg opacity-40 hover:opacity-60 transition overflow-hidden"
        >
          <img
            src={tiles[nextTile].url}
            alt="Next"
            className="w-full h-full object-cover"
          />
        </button>
      )}
    </div>
  );
}
```
FloatingToolbar with slash commands
```
import { useCallback, useState, useEffect } from "react";
import { useStorage } from "@liveblocks/react/suspense";

function FloatingToolbar() {
  const { tiles } = useStorage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // +++  Cmd+E to open +++
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

  const commands = [
    {
      id: "new-doc",
      label: "New Document",
      icon: "📄",
      action: () => createNewTile("document"),
    },
    {
      id: "new-webpage",
      label: "Open Webpage",
      icon: "🌐",
      action: () => createNewTile("webpage"),
    },
    {
      id: "layout-canvas",
      label: "Canvas Layout",
      icon: "📐",
      action: () => switchLayout("canvas"),
    },
    {
      id: "layout-grid",
      label: "Grid Layout",
      icon: "▦",
      action: () => switchLayout("grid"),
    },
    {
      id: "close-all",
      label: "Close All Tiles",
      icon: "✕",
      action: () => closeAllTiles(),
    },
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const createNewTile = (type: Tile["type"]) => {
    const newTile = {
      id: `tile-${Date.now()}`,
      title: type === "document" ? "New Document" : "New Webpage",
      type,
      x: Math.random() * 200,
      y: Math.random() * 200,
      z: (Object.values(tiles || {}).length) + 1,
      width: 400,
      height: 300,
      content: type === "document" ? "" : undefined,
    };

    tiles?.[newTile.id]?.set?.(newTile) || tiles?.set?.(newTile.id, newTile);
    setIsOpen(false);
  };

  const switchLayout = (layout: "canvas" | "grid") => {
    // Update layout in storage
    setIsOpen(false);
  };

  const closeAllTiles = () => {
    // Clear all tiles
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      {/* +++  Toolbar button (mobile) +++  */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-3 bg-blue-600 text-white rounded-full shadow-lg"
      >
        ⚙️
      </button>

      {/* +++  Slash command palette +++  */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-gray-900 rounded-lg shadow-2xl w-64 overflow-hidden border border-gray-700"
        >
          {/* Search input */}
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commands..."
            className="w-full px-3 py-2 bg-gray-800 text-white text-sm border-b border-gray-700 focus:outline-none"
          />

          {/* Command list */}
          <div className="max-h-80 overflow-y-auto">
            {filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  setSearchQuery("");
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-800 flex items-center gap-2 transition"
              >
                <span>{cmd.icon}</span>
                <span>{cmd.label}</span>
              </button>
            ))}
          </div>

          {/* Hint */}
          <div className="px-3 py-2 border-t border-gray-700 text-xs text-gray-500">
            Press <kbd className="bg-gray-800 px-1 rounded">⌘E</kbd> to close
          </div>
        </motion.div>
      )}
    </div>
  );
}
```
Tiptap integration for documents
```
import { useCreateTiptapBinding } from "@liveblocks/react-tiptap";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";

function TiptapFullEditor({ tileId }: { tileId: string }) {
  const { tiles } = useStorage();
  const tile = tiles?.[tileId];

  const editor = useEditor({
    extensions: [StarterKit],
  });

  useCreateTiptapBinding({
    editor,
    field: tile,
  });

  return (
    <div className="w-full h-full p-6">
      <EditorContent editor={editor} />
    </div>
  );
}
```
Key libraries you'll need
```
npm install @liveblocks/react @liveblocks/react-tiptap framer-motion react-draggable @tiptap/react @tiptap/starter-kit
```
Storage initialization
Set up your Liveblocks schema with useInitialStorage:
```
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense";

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={"pk_dev_vWYt7jQo6ZtbQk4EbLE9S7a_3qIYHAvwqcXr8eWwicobkAET_cZ5gCAB68WytsoX"}>
      <RoomProvider id="browser-canvas">
        <ClientSideSuspense fallback={<LoadingScreen />}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
```
This is honestly a killer spotlight example for Liveblocks—it showcases real-time collaboration, dynamic layouts, and sophisticated state management in a way users actually want to use. Want me to help refine any specific part, like the grid layout variant, fanned-out grouping animation, or webpage rendering?
---
yes!!! I want to include built in apps too they can access through the FloatingToolbar such as so the Notion style editor. With all the collab features and everything that comes with that LB example. Apps will open up in the canvas dead center like a blurred bg modal would and handle all the docs and storage relative to that component inside itself. So this would need to be sort of turbopack or micro if that makes sense. 
---
Perfect! This is exactly what you need—a micro-frontend architecture where each app is self-contained. Here's how to build this with dynamic imports and scoped storage:

App registry & loader
```
import { ReactNode } from "react";

// +++  App manifest +++
interface AppConfig {
  id: string;
  name: string;
  icon: string;
  component: () => Promise<{ default: React.ComponentType<AppProps> }>;
}

interface AppProps {
  appInstanceId: string;
  onClose: () => void;
}

const BUILTIN_APPS: AppConfig[] = [
  {
    id: "notion-editor",
    name: "Notion Editor",
    icon: "📝",
    component: () =>
      import("./apps/NotionEditor").then((m) => ({ default: m.NotionEditor })),
  },
  {
    id: "tiptap-editor",
    name: "Tiptap Editor",
    icon: "✍️",
    component: () =>
      import("./apps/TiptapEditor").then((m) => ({ default: m.TiptapEditor })),
  },
  {
    id: "whiteboard",
    name: "Whiteboard",
    icon: "🎨",
    component: () =>
      import("./apps/Whiteboard").then((m) => ({ default: m.Whiteboard })),
  },
  {
    id: "spreadsheet",
    name: "Spreadsheet",
    icon: "📊",
    component: () =>
      import("./apps/Spreadsheet").then((m) => ({
        default: m.Spreadsheet,
      })),
  },
];

export { BUILTIN_APPS, type AppConfig, type AppProps };
App modal wrapper
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppConfig, AppProps } from "./app-registry";

interface ActiveApp {
  id: string;
  instanceId: string;
  config: AppConfig;
}

function AppModal({ app, onClose }: { app: ActiveApp; onClose: () => void }) {
  const [Component, setComponent] = useState<React.ComponentType<AppProps> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // +++  Lazy load app component +++
    app.config.component().then((module) => {
      setComponent(() => module.default);
      setLoading(false);
    });
  }, [app.config]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* +++  Blurred background effect +++  */}
        <div className="absolute inset-0 blur-3xl pointer-events-none" />

        {/* +++  Modal card +++  */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative z-10 w-11/12 h-5/6 max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <span className="text-xl">{app.config.icon}</span>
              <h2 className="text-lg font-semibold text-gray-900">
                {app.config.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="w-full h-[calc(100%-60px)] overflow-auto bg-white">
            {loading ? (
              <div className="flex items-center justify-center w-full h-full">
                <div className="text-gray-400">Loading {app.config.name}...</div>
              </div>
            ) : Component ? (
              // +++  App rendered in isolation +++
              <Component
                appInstanceId={app.instanceId}
                onClose={onClose}
              />
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export { AppModal };
Updated FloatingToolbar with apps
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BUILTIN_APPS } from "./app-registry";
import { AppModal } from "./AppModal";

interface ActiveApp {
  id: string;
  instanceId: string;
  config: (typeof BUILTIN_APPS)[0];
}

function FloatingToolbar() {
  const { tiles, layout } = useStorage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // +++  Track active apps (can have multiple instances) +++
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
    {
      id: "app-notion",
      label: "Open Notion Editor",
      icon: "📝",
      category: "Apps",
      // +++  Open app in modal +++
      action: () => {
        const appConfig = BUILTIN_APPS.find((a) => a.id === "notion-editor")!;
        setActiveApps([
          ...activeApps,
          {
            id: appConfig.id,
            instanceId: `instance-${Date.now()}`,
            config: appConfig,
          },
        ]);
      },
    },
    {
      id: "app-tiptap",
      label: "Open Tiptap Editor",
      icon: "✍️",
      category: "Apps",
      action: () => {
        const appConfig = BUILTIN_APPS.find((a) => a.id === "tiptap-editor")!;
        setActiveApps([
          ...activeApps,
          {
            id: appConfig.id,
            instanceId: `instance-${Date.now()}`,
            config: appConfig,
          },
        ]);
      },
    },
    {
      id: "app-whiteboard",
      label: "Open Whiteboard",
      icon: "🎨",
      category: "Apps",
      action: () => {
        const appConfig = BUILTIN_APPS.find((a) => a.id === "whiteboard")!;
        setActiveApps([
          ...activeApps,
          {
            id: appConfig.id,
            instanceId: `instance-${Date.now()}`,
            config: appConfig,
          },
        ]);
      },
    },
    {
      id: "app-spreadsheet",
      label: "Open Spreadsheet",
      icon: "📊",
      category: "Apps",
      action: () => {
        const appConfig = BUILTIN_APPS.find((a) => a.id === "spreadsheet")!;
        setActiveApps([
          ...activeApps,
          {
            id: appConfig.id,
            instanceId: `instance-${Date.now()}`,
            config: appConfig,
          },
        ]);
      },
    },

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

  // Group by category
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
      {/* Mobile button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-3 bg-blue-600 text-white rounded-full shadow-lg"
      >
        ⚙️
      </button>

      {/* Command palette */}
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
                {/* +++  Category header +++  */}
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

      {/* +++  Active app modals +++  */}
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
```
Notion-style editor app (BlockNote example)
// apps/NotionEditor.tsx
```
import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { AppProps } from "../app-registry";

export function NotionEditor({ appInstanceId, onClose }: AppProps) {
  // +++  Use appInstanceId to create scoped room +++
  const roomId = `app-notion-${appInstanceId}`;

  return (
    <LiveblocksProvider publicApiKey={"pk_dev_vWYt7jQo6ZtbQk4EbLE9S7a_3qIYHAvwqcXr8eWwicobkAET_cZ5gCAB68WytsoX"}>
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<LoadingSpinner />}>
          <NotionEditorContent onClose={onClose} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function NotionEditorContent({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* App-specific toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-800">Notion Editor</h3>
        <div className="flex gap-2">
          <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded">
            Share
          </button>
          <button className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded">
            Export
          </button>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto">
        {/* +++  BlockNote with all Liveblocks features +++  */}
        <BlockNoteWithCollaboration />
      </div>
    </div>
  );
}

function BlockNoteWithCollaboration() {
  const { doc } = useStorage();
  const { threads } = useThreads();

  const editor = useCreateBlockNoteWithLiveblocks({
    collaboration: {
      provider: "liveblocks",
      awareness: "liveblocks",
    },
  });

  return (
    <div className="flex gap-4 h-full">
      {/* +++  Main editor +++  */}
      <div className="flex-1 p-6">
        <BlockNoteView editor={editor} />
      </div>

      {/* +++  Comments sidebar +++  */}
      <div className="w-80 border-l bg-gray-50 p-4 overflow-auto">
        <h4 className="font-semibold mb-4">Comments</h4>
        {threads && threads.length > 0 ? (
          threads.map((thread) => (
            <Thread key={thread.id} thread={thread} />
          ))
        ) : (
          <p className="text-sm text-gray-500">No comments yet</p>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin text-2xl">⚙️</div>
    </div>
  );
}
```
Tiptap editor app
```
// apps/TiptapEditor.tsx
import { AppProps } from "../app-registry";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useCreateTiptapBinding } from "@liveblocks/react-tiptap";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useStorage } from "@liveblocks/react/suspense";

export function TiptapEditor({ appInstanceId, onClose }: AppProps) {
  const roomId = `app-tiptap-${appInstanceId}`;

  return (
    <LiveblocksProvider publicApiKey={"pk_dev_vWYt7jQo6ZtbQk4EbLE9S7a_3qIYHAvwqcXr8eWwicobkAET_cZ5gCAB68WytsoX"}>
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div>Loading editor...</div>}>
          <TiptapEditorContent />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function TiptapEditorContent() {
  const { doc } = useStorage();

  const editor = useEditor({
    extensions: [StarterKit],
  });

  // +++  Bind editor to Liveblocks storage +++
  useCreateTiptapBinding({
    editor,
    field: doc,
  });

  return (
    <div className="h-full p-6 bg-white">
      <EditorContent
        editor={editor}
        className="prose max-w-none"
      />
    </div>
  );
}
```
Whiteboard app example
```
// apps/Whiteboard.tsx
import { AppProps } from "../app-registry";
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

export function Whiteboard({ appInstanceId, onClose }: AppProps) {
  const roomId = `app-whiteboard-${appInstanceId}`;

  return (
    <LiveblocksProvider publicApiKey={"pk_dev_vWYt7jQo6ZtbQk4EbLE9S7a_3qIYHAvwqcXr8eWwicobkAET_cZ5gCAB68WytsoX"}>
      <RoomProvider id={roomId}>
        {/* +++  Your whiteboard implementation +++  */}
        <WhiteboardCanvas />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function WhiteboardCanvas() {
  const { strokes } = useStorage();
  const updatePresence = useUpdateMyPresence();

  return (
    <canvas
      className="w-full h-full bg-white cursor-crosshair"
      onMouseDown={(e) => {
        // Drawing logic
      }}
    />
  );
}
```
Build configuration (turbopack)
In next.config.js:
```
/** @type {import('next').NextConfig} */
const nextConfig = {
  // +++  Enable turbopack for faster builds +++
  experimental: {
    turbopack: true,
  },

  // Code splitting for app modules
  webpack: (config, { isServer }) => {
    return config;
  },
};

module.exports = nextConfig;
```
stage 1 complete.
