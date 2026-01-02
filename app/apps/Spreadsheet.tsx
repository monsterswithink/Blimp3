"use client";

import { AppProps } from "../app-registry";

export function Spreadsheet({ appInstanceId, onClose }: AppProps) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <h1 className="text-2xl font-bold">Spreadsheet</h1>
    </div>
  );
}

export default Spreadsheet;
