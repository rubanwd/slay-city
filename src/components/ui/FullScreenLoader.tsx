import HissableMascot from "@/components/ui/HissableMascot";
import { DEFAULT_MASCOT_IMAGE } from "@/features/wardrobe/mascot";

export interface FullScreenLoaderProps {
  /** Optional caption shown under the mascot (e.g. "Loading map…"). */
  label?: string;
  /**
   * When `false`, fills its positioned parent instead of the viewport — used as
   * an overlay on top of content that is still loading (e.g. the map image).
   */
  fullScreen?: boolean;
  /**
   * Show the bobbing mascot. Kept on for the kid-facing game screens; turned
   * off on admin/tooling surfaces, where a mascot on every navigation is noise.
   */
  mascot?: boolean;
  /**
   * Which mascot artwork to show — pass the player's resolved equipped look
   * (see `loadMascotImage`/`readMascotImageCookie`) so this matches Wardrobe.
   * Defaults to the plain base snake when the caller doesn't know it.
   */
  mascotImageUrl?: string;
}

/**
 * Branded loading state — a bobbing SLAY snake over the neon-city black, with a
 * pulsing shadow and three bouncing dots. Rendered as the route transition
 * fallback (`loading.tsx`) and as an overlay while heavy remote images decode.
 * Respects `prefers-reduced-motion` (animations disabled).
 */
export default function FullScreenLoader({
  label,
  fullScreen = true,
  mascot = true,
  mascotImageUrl = DEFAULT_MASCOT_IMAGE,
}: FullScreenLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        fullScreen ? "fixed inset-0 z-50" : "absolute inset-0 z-30",
        "flex flex-col items-center justify-center bg-black",
        mascot ? "gap-6" : "gap-4",
      ].join(" ")}
    >
      {/* Tappable while the route loads — waiting is more fun with a hiss. */}
      {mascot && (
        <HissableMascot
          src={mascotImageUrl}
          imageClassName="h-24 w-24 object-contain drop-shadow-[0_0_20px_rgba(157,255,0,0.45)] animate-loader-bob"
          shadowClassName="mt-1 h-2 w-16 rounded-full bg-lime-green/40 blur-[3px] animate-loader-shadow"
        />
      )}

      <div className="flex items-center gap-2" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-neon-pink animate-loader-dot [animation-delay:0ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-lime-green animate-loader-dot [animation-delay:180ms]" />
        <span className="h-2.5 w-2.5 rounded-full bg-cyan animate-loader-dot [animation-delay:360ms]" />
      </div>

      {(label || mascot) && (
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-white/70">
          {label ?? "Slay City"}
        </span>
      )}
    </div>
  );
}
