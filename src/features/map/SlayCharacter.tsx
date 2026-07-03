"use client";

import UiSlayCharacter from "@/components/ui/SlayCharacter";

/** Positions the shared mascot atom as a floating overlay above a map node. */
export default function SlayCharacter() {
  return (
    <div className="absolute -top-16 left-1/2 -translate-x-1/2 pointer-events-none z-10">
      <UiSlayCharacter size="sm" wiggle aria-label="Slay, your current location" />
    </div>
  );
}
