"use client";

export type SlayCharacterSize = "xs" | "sm" | "md" | "lg" | "xl" | "full";

export interface SlayCharacterProps {
  size?: SlayCharacterSize;
  /** Plays the wiggle animation continuously */
  wiggle?: boolean;
  className?: string;
  "aria-label"?: string;
}

const SIZE_PX: Record<SlayCharacterSize, number | string> = {
  xs:    64,
  sm:    96,
  md:   144,
  lg:   200,
  xl:   280,
  full: "100%",
};

export default function SlayCharacter({
  size = "md",
  wiggle = false,
  className = "",
  "aria-label": ariaLabel = "Slay City snake character",
}: SlayCharacterProps) {
  const dim = SIZE_PX[size];
  const style =
    typeof dim === "number"
      ? { width: dim, height: dim }
      : { width: dim, aspectRatio: "1 / 1" };

  return (
    <div
      className={[
        "relative shrink-0",
        wiggle ? "animate-[wiggle_1.6s_ease-in-out_infinite]" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {wiggle && (
        <style>{`
          @keyframes wiggle {
            0%,100% { transform: rotate(-4deg) translateY(0px); }
            25%      { transform: rotate(4deg)  translateY(-5px); }
            50%      { transform: rotate(-3deg) translateY(0px); }
            75%      { transform: rotate(3deg)  translateY(-2px); }
          }
        `}</style>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element -- local static mascot illustration */}
      <img
        src="/mascot-slay.svg"
        alt={ariaLabel}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
