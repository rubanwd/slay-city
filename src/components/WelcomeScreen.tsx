import Link from "next/link";

import { AppContainer, Section } from "@/components/layout";

/* ── Decorative inline icons — one-off, brand-specific, not worth a shared
   icon library for a single screen. ──────────────────────────────────────── */

function CrownIcon() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
      <path
        d="M2 18l3-11 5.5 6L14 2l3.5 11L23 7l3 11H2z"
        fill="currentColor"
      />
    </svg>
  );
}

function LightningIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.5-6.3 4.5 2.3-7.2-6-4.6h7.6z" />
    </svg>
  );
}

function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 20s-7.5-4.7-10-9.3C.4 7.4 2.2 4 5.6 4c2 0 3.5 1.1 4.4 2.6C10.9 5.1 12.4 4 14.4 4c3.4 0 5.2 3.4 3.6 6.7C20 15.3 12 20 12 20z" />
    </svg>
  );
}

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WelcomeScreen() {
  return (
    <AppContainer>
      <Section py="lg" className="gap-2">
        <div className="flex items-start gap-1.5">
          <span className="text-4xl font-black italic text-neon-pink lowercase tracking-tight">
            slay
          </span>
          <span className="text-lime-green mt-1">
            <CrownIcon />
          </span>
        </div>

        <p className="text-sm font-semibold uppercase tracking-wide">
          <span className="text-white/70">Learn English. </span>
          <span className="text-lime-green">Slay</span>
          <span className="text-white/70"> your goals.</span>
        </p>
      </Section>

      <div className="flex-1 flex flex-col justify-center gap-8">
        <div className="relative mx-auto w-full max-w-[280px]">
          <LightningIcon className="text-lime-green absolute -top-8 left-2" />

          <div className="relative rounded-3xl bg-gradient-to-b from-purple/20 via-black to-black p-3 animate-glow">
            {/* eslint-disable-next-line @next/next/no-img-element -- local static placeholder illustration */}
            <img
              src="/mascot-slay.svg"
              alt="Slay City mascot — a snake wearing headphones and a hoodie"
              className="w-full aspect-square object-contain"
            />

            <StarIcon className="text-neon-pink absolute -top-3 -right-3" />
            <HeartIcon className="text-neon-pink absolute -bottom-3 -left-3" />
            <SparkleIcon className="text-cyan absolute bottom-3 right-3" />
          </div>
        </div>
      </div>

      <Section py="lg" className="gap-4">
        <Link
          href="/auth/register"
          className={[
            "inline-flex items-center justify-center gap-2.5 w-full h-16 px-8 rounded-2xl",
            "font-extrabold uppercase tracking-wide text-lg",
            "bg-lime-green text-black",
            "hover:brightness-110 active:brightness-90 transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-green focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          ].join(" ")}
        >
          Let&apos;s Go!
          <ChevronIcon />
        </Link>

        <p className="text-sm text-white/50 text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-neon-pink font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </Section>
    </AppContainer>
  );
}
