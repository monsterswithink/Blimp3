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
