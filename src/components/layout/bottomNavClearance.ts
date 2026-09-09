/**
 * Bottom padding a page's scrollable content needs so the fixed `BottomNav` —
 * tab row (~79px) plus the watermark strip (38px) — never covers it. Also adds
 * the device's own safe-area inset, since the nav bar grows by that same amount
 * (see its `pb-[env(safe-area-inset-bottom)]`) and a flat 150px alone falls
 * short on phones with a home indicator, clipping the last row of content.
 *
 * Deliberately kept in this plain module rather than next to the bar in
 * `BottomNav.tsx`: that file is `"use client"`, and every export of a client
 * module reaches a Server Component as a client-reference proxy, not its value.
 * Interpolated into a `className` the proxy stringifies to junk, so the padding
 * silently vanished on every server-rendered screen (the teacher and parent
 * dashboards among them) and the nav sat on top of the last card.
 */
export const BOTTOM_NAV_CLEARANCE = "pb-[calc(150px+env(safe-area-inset-bottom))]";
