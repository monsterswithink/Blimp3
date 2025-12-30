"use client";

import { AppProps } from "../app-registry";

export function TiptapEditor({ appInstanceId, onClose }: AppProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <h1 className="text-2xl font-bold">Tiptap Editor</h1>
    </div>
  );
}

export default TiptapEditor;
