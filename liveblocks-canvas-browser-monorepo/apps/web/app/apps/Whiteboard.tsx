"use client";

import { AppProps } from "../app-registry";

export function Whiteboard({ appInstanceId, onClose }: AppProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <h1 className="text-2xl font-bold">Whiteboard</h1>
    </div>
  );
}

export default Whiteboard;
