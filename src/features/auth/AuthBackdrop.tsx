/**
 * Decorative background for the login/register screens — soft brand-color
 * glow blobs plus a dimmed, blurred snake mascot peeking from a corner.
 * Purely visual: `aria-hidden` and clipped to the container so it never
 * affects layout or a11y.
 */
export default function AuthBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -left-16 h-64 w-64 rounded-full bg-purple/40 blur-3xl" />
      <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-neon-pink/25 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-lime-green/15 blur-3xl" />

      {/* eslint-disable-next-line @next/next/no-img-element -- decorative background art, blurred/dimmed */}
      <img
        src="/wardrobe/slay-base.webp"
        alt=""
        className="absolute -bottom-12 -right-14 h-72 w-72 rotate-6 object-contain opacity-15 blur-[2px]"
      />
    </div>
  );
}
