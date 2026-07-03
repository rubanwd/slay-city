"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { createProfile, type OnboardingState } from "./actions";
import { AVATAR_OPTIONS, DEFAULT_AVATAR_URL } from "./avatars";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 caret-neon-pink " +
  "border border-white/20 transition-colors " +
  "focus:outline-none focus:bg-white/15 focus:border-neon-pink " +
  "focus:ring-2 focus:ring-neon-pink/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="lg" loading={pending} className="w-full">
      Enter the City →
    </SlayButton>
  );
}

export default function OnboardingForm() {
  const [state, formAction] = useActionState<OnboardingState, FormData>(createProfile, {});
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);

  return (
    <form action={formAction} className="w-full flex flex-col gap-6">
      <h1 className="text-h1 font-black text-white tracking-tight text-center">
        Create Your <span className="text-neon-pink">Profile</span>
      </h1>

      <label className="flex flex-col gap-1.5">
        <span className="text-label text-white/50 uppercase tracking-widest">Username</span>
        <input
          name="username"
          type="text"
          required
          minLength={2}
          maxLength={20}
          placeholder="Enter your name"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-label text-white/50 uppercase tracking-widest">
          Age <span className="normal-case text-white/30">(optional)</span>
        </span>
        <input
          name="age"
          type="number"
          min={7}
          max={14}
          placeholder="7-14"
          className={INPUT_CLASS}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-label text-white/50 uppercase tracking-widest">
          Choose an Avatar
        </span>
        <div className="grid grid-cols-3 gap-3">
          {AVATAR_OPTIONS.map((option) => {
            const selected = option.url === avatarUrl;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setAvatarUrl(option.url)}
                aria-pressed={selected}
                aria-label={option.label}
                className={[
                  "rounded-2xl p-2 border-2 transition-all",
                  selected
                    ? "border-neon-pink bg-neon-pink/10 scale-105"
                    : "border-white/15 hover:border-white/40",
                ].join(" ")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local static SVG, no benefit from next/image */}
                <img src={option.url} alt="" className="w-full aspect-square rounded-xl" />
              </button>
            );
          })}
        </div>
      </div>
      <input type="hidden" name="avatarUrl" value={avatarUrl} />

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink text-center">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
