"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppContainer, Section } from "@/components/layout";
import { CoinIcon, SlayButton, SlayCharacter, XpIcon } from "@/components/ui";

export interface RewardScreenProps {
  /** Coins granted for completing the mission */
  coins: number;
  /** XP granted for completing the mission */
  xp: number;
  /** Title of the mission just completed */
  missionTitle: string;
  /** Names of the tasks completed as part of this mission */
  taskNames: string[];
  /** Where the Continue button sends the player */
  continueHref?: string;
}

/* Brand palette used for the falling rain dots */
const RAIN_COLORS = [
  "rgb(var(--color-neon-pink))",
  "rgb(var(--color-lime-green))",
  "rgb(var(--color-cyan))",
  "rgb(var(--color-purple))",
  "#facc15", // yellow-400 (coins)
];

interface RainDrop {
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
}

/** Builds a field of randomly-placed rain drops. Called from an effect so the
 * (impure) randomness never runs during render, keeping the component pure. */
function buildRainDrops(count: number): RainDrop[] {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    size: 6 + Math.random() * 8,
    color: RAIN_COLORS[Math.floor(Math.random() * RAIN_COLORS.length)],
    delay: Math.random() * 2.5,
    duration: 2.4 + Math.random() * 2.6,
    drift: (Math.random() - 0.5) * 40,
  }));
}

export default function RewardScreen({
  coins,
  xp,
  missionTitle,
  taskNames,
  continueHref = "/map",
}: RewardScreenProps) {
  const router = useRouter();
  const [drops, setDrops] = useState<RainDrop[]>([]);

  // Generate the rain client-side only: the positions are random, so building
  // them during SSR/render would cause a hydration mismatch. The CSS entrance
  // animations below play automatically on mount without any JS flag.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deferred to the client on purpose to avoid a hydration mismatch from random values
    setDrops(buildRainDrops(48));
  }, []);

  return (
    <AppContainer className="relative justify-center overflow-hidden">
      <style>{`
        @keyframes reward-rain {
          0%   { transform: translateY(-12vh) translateX(0);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(112vh) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes reward-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes reward-rise {
          0%   { transform: translateY(16px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
        @keyframes reward-headline-pulse {
          0%, 100% {
            transform: scale(1);
            text-shadow: 0 0 12px rgba(255,45,142,0.9), 0 0 28px rgba(255,45,142,0.55);
          }
          50% {
            transform: scale(1.06);
            text-shadow: 0 0 20px rgba(255,45,142,1), 0 0 44px rgba(255,45,142,0.8);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .reward-drop { display: none; }
          .reward-headline { animation: none !important; }
        }
      `}</style>

      {/* ── Falling colored rain ─────────────────────────────────────────── */}
      {drops.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          {drops.map((d, i) => (
            <span
              key={i}
              className="reward-drop absolute top-0 rounded-full"
              style={{
                left: `${d.left}%`,
                width: d.size,
                height: d.size,
                backgroundColor: d.color,
                boxShadow: `0 0 8px ${d.color}`,
                // @ts-expect-error -- custom property consumed by the keyframes
                "--drift": `${d.drift}px`,
                animation: `reward-rain ${d.duration}s linear ${d.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      <Section className="relative z-10 items-center gap-6 text-center">
        {/* Headline */}
        <h1
          className="reward-headline text-display font-black uppercase leading-none text-neon-pink"
          style={{
            textShadow:
              "0 0 12px rgba(255,45,142,0.9), 0 0 28px rgba(255,45,142,0.55)",
            animation:
              "reward-pop 0.5s ease-out both, reward-headline-pulse 1.6s ease-in-out 0.5s infinite",
          }}
        >
          Amazing!
        </h1>

        {/* Character */}
        <div
          className="rounded-3xl bg-gradient-to-br from-purple/25 to-neon-pink/15 p-3 ring-2 ring-neon-pink/25"
          style={{ animation: "reward-pop 0.6s ease-out 0.1s both" }}
        >
          <SlayCharacter
            size="lg"
            wiggle
            src="/wardrobe/slay-hero.webp"
            aria-label="Slay celebrating"
          />
        </div>

        {/* Reward cards */}
        <div
          className="grid w-full grid-cols-2 gap-3"
          style={{ animation: "reward-rise 0.5s ease-out 0.25s both" }}
        >
          {/* Coins */}
          <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/5 py-5">
            <CoinIcon size={40} />
            <span className="text-2xl font-black text-yellow-300">+{coins}</span>
            <span className="text-small font-bold uppercase tracking-wide text-white/50">
              Coins
            </span>
          </div>

          {/* XP */}
          <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/5 py-5">
            <XpIcon size={40} className="text-cyan" />
            <span className="text-2xl font-black text-cyan">+{xp}</span>
            <span className="text-small font-bold uppercase tracking-wide text-white/50">XP</span>
          </div>
        </div>

        {/* Mission recap */}
        <div
          className="flex flex-col items-center gap-1"
          style={{ animation: "reward-rise 0.5s ease-out 0.35s both" }}
        >
          <span className="text-small font-bold uppercase tracking-wide text-white/50">
            Mission Complete
          </span>
          <p className="text-h3 font-black leading-tight text-white">{missionTitle}</p>
        </div>

        {taskNames.length > 0 && (
          <p
            className="text-body text-white/60"
            style={{ animation: "reward-rise 0.5s ease-out 0.45s both" }}
          >
            {taskNames.join(" · ")}
          </p>
        )}

        {/* Continue */}
        <SlayButton
          variant="green"
          size="lg"
          className="w-full"
          onClick={() => router.push(continueHref)}
          style={{ animation: "reward-rise 0.5s ease-out 0.55s both" }}
        >
          Claim Reward
        </SlayButton>
      </Section>
    </AppContainer>
  );
}
