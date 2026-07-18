"use client";

import NextLink, { useLinkStatus } from "next/link";
import { type ComponentProps } from "react";
import { createPortal } from "react-dom";

import FullScreenLoader from "./FullScreenLoader";

/**
 * Shows the full-screen loader while *this* link's navigation is in flight.
 *
 * `useLinkStatus` flips to `pending` the instant the link is activated — before
 * the server responds — so it covers the gap that `loading.tsx` cannot: every
 * admin hop first runs the auth middleware (a Supabase `getUser()` round-trip
 * plus a profile lookup) before the destination route can even begin to render,
 * and `loading.tsx` only appears once that response starts streaming. Until
 * then the tapped screen would sit frozen with no feedback. Rendered through a
 * portal so it never disturbs the link's own layout.
 */
function LinkPendingOverlay() {
  const { pending } = useLinkStatus();
  // `pending` only ever turns true during a client-side navigation, so the DOM
  // is guaranteed present; the `document` guard is just belt-and-suspenders for
  // server rendering, where the portal target doesn't exist.
  if (!pending || typeof document === "undefined") return null;

  return createPortal(
    <FullScreenLoader mascot={false} label="Loading…" />,
    document.body
  );
}

/**
 * Drop-in replacement for `next/link` that shows an instant loading overlay for
 * the duration of the navigation. Use it for admin navigation, where the auth
 * middleware makes plain links feel unresponsive on tap.
 */
export default function NavLink({ children, ...props }: ComponentProps<typeof NextLink>) {
  return (
    <NextLink {...props}>
      {children}
      <LinkPendingOverlay />
    </NextLink>
  );
}
