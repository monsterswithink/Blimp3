"use client";

import { Room } from "./Room";
import { BrowserCanvas } from "./BrowserCanvas";

export default function Page() {
  return (
    <Room>
      <BrowserCanvas />
    </Room>
  );
}
