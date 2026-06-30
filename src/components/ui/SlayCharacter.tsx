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

      <svg
        viewBox="0 0 500 510"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={ariaLabel}
        role="img"
        style={{ width: "100%", height: "100%" }}
      >
        {/* ── Z-ORDER (back → front):
              tail → coil → body-sides → torso → hoodie → neck →
              ear cups → head → eyes/face → headphone band            ── */}

        {/* ── TAIL (right side, curves up and right) ──────────────────────── */}
        <path
          d="M388 336
             C 442 305, 454 248, 432 210
             C 418 185, 398 187, 393 206
             C 388 225, 406 238, 405 256
             C 404 274, 386 294, 362 318"
          fill="#7DC52E"
          stroke="#1A1A1A"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* ── COIL (large oval base) ──────────────────────────────────────── */}
        {/* Shadow underneath for depth */}
        <ellipse cx="250" cy="406" rx="190" ry="96" fill="#5A9810" />
        {/* Main coil */}
        <ellipse cx="250" cy="396" rx="190" ry="92" fill="#7DC52E" stroke="#1A1A1A" strokeWidth="5" />
        {/* Inner coil ridge — gives the 3-D wrapped look */}
        <path
          d="M108 378 Q162 338 250 332 Q338 338 392 378"
          stroke="#5A9810"
          strokeWidth="8"
          fill="none"
          opacity="0.75"
        />

        {/* ── LEFT BODY SIDE (snake body visible left of hoodie) ──────────── */}
        <path
          d="M158 275
             C 132 278, 124 305, 126 330
             C 128 354, 146 364, 162 356
             C 152 330, 152 302, 160 278 Z"
          fill="#7DC52E"
          stroke="#1A1A1A"
          strokeWidth="4"
        />

        {/* ── RIGHT BODY SIDE ─────────────────────────────────────────────── */}
        <path
          d="M342 275
             C 368 278, 376 305, 374 330
             C 372 354, 354 364, 338 356
             C 348 330, 348 302, 340 278 Z"
          fill="#7DC52E"
          stroke="#1A1A1A"
          strokeWidth="4"
        />

        {/* ── UPPER TORSO (green, between coil and hoodie) ────────────────── */}
        <path
          d="M178 270
             C 164 240, 166 210, 168 198
             C 174 180, 210 174, 250 174
             C 290 174, 326 180, 332 198
             C 334 210, 336 240, 322 270
             C 304 282, 278 288, 250 288
             C 222 288, 196 282, 178 270 Z"
          fill="#7DC52E"
          stroke="#1A1A1A"
          strokeWidth="4.5"
        />

        {/* ── HOODIE ──────────────────────────────────────────────────────── */}
        <path
          d="M178 276
             C 150 272, 144 304, 142 336
             C 140 366, 154 392, 178 406
             C 200 418, 250 420, 250 420
             C 250 420, 300 418, 322 406
             C 346 392, 360 366, 358 336
             C 356 304, 350 272, 322 276
             C 304 294, 278 298, 250 298
             C 222 298, 196 294, 178 276 Z"
          fill="#1C1C1C"
          stroke="#1A1A1A"
          strokeWidth="4"
        />

        {/* V-neck opening (deep, showing green chest) */}
        <path
          d="M196 276 L250 332 L304 276"
          fill="#7DC52E"
          stroke="#1A1A1A"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* SLAY text on chest */}
        <text
          x="250"
          y="384"
          textAnchor="middle"
          fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
          fontWeight="900"
          fontSize="40"
          fill="#FF2D8E"
          letterSpacing="3"
        >
          SLAY
        </text>

        {/* ── NECK ────────────────────────────────────────────────────────── */}
        <path
          d="M214 276
             C 206 248, 208 220, 212 204
             C 218 188, 234 184, 250 184
             C 266 184, 282 188, 288 204
             C 292 220, 294 248, 286 276
             C 272 288, 258 292, 250 292
             C 242 292, 228 288, 214 276 Z"
          fill="#7DC52E"
          stroke="#1A1A1A"
          strokeWidth="4"
        />

        {/* ── HEADPHONE EAR CUPS (behind head, so rendered before head) ───── */}
        {/* Left cup */}
        <circle cx="148" cy="174" r="47" fill="#FF2D8E" stroke="#B8005A" strokeWidth="3" />
        <circle cx="148" cy="174" r="29" fill="#CC006A" />
        <ellipse cx="135" cy="160" rx="11" ry="8" fill="#FF9ECE" opacity="0.5" />

        {/* Right cup */}
        <circle cx="352" cy="174" r="47" fill="#FF2D8E" stroke="#B8005A" strokeWidth="3" />
        <circle cx="352" cy="174" r="29" fill="#CC006A" />
        <ellipse cx="339" cy="160" rx="11" ry="8" fill="#FF9ECE" opacity="0.5" />

        {/* ── HEAD ────────────────────────────────────────────────────────── */}
        <ellipse cx="250" cy="148" rx="92" ry="86" fill="#7DC52E" stroke="#1A1A1A" strokeWidth="5" />
        {/* Top highlight dome */}
        <ellipse cx="228" cy="116" rx="56" ry="38" fill="#96E030" opacity="0.32" />

        {/* ── EYES ────────────────────────────────────────────────────────── */}
        {/* Left eye — white sclera */}
        <ellipse cx="212" cy="140" rx="28" ry="32" fill="white" stroke="#1A1A1A" strokeWidth="3.5" />
        {/* Left iris — purple */}
        <ellipse cx="212" cy="143" rx="19" ry="22" fill="#6B4EA0" />
        {/* Left pupil */}
        <ellipse cx="213" cy="146" rx="11" ry="13" fill="#1A0830" />
        {/* Left highlight */}
        <circle cx="203" cy="132" r="8" fill="white" opacity="0.95" />

        {/* Right eye — white sclera */}
        <ellipse cx="288" cy="140" rx="28" ry="32" fill="white" stroke="#1A1A1A" strokeWidth="3.5" />
        {/* Right iris */}
        <ellipse cx="288" cy="143" rx="19" ry="22" fill="#6B4EA0" />
        {/* Right pupil */}
        <ellipse cx="289" cy="146" rx="11" ry="13" fill="#1A0830" />
        {/* Right highlight */}
        <circle cx="279" cy="132" r="8" fill="white" opacity="0.95" />

        {/* ── NOSE ────────────────────────────────────────────────────────── */}
        <circle cx="239" cy="175" r="4.5" fill="#4A8010" />
        <circle cx="261" cy="175" r="4.5" fill="#4A8010" />

        {/* ── SMILE ───────────────────────────────────────────────────────── */}
        <path
          d="M222 192 Q250 216 278 192"
          stroke="#1A1A1A"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* ── HEADPHONE BAND (rendered last — sits over the head) ─────────── */}
        <path
          d="M150 173 Q148 54 250 48 Q352 54 350 173"
          stroke="#FF2D8E"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />
        {/* Band highlight sheen */}
        <path
          d="M158 169 Q156 66 250 60 Q344 66 342 169"
          stroke="#FF9ECE"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          opacity="0.36"
        />
      </svg>
    </div>
  );
}
