"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { resetPasswordFormAction, type AuthState } from "./actions";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 caret-neon-pink " +
  "border border-white/20 transition-colors " +
  "focus:outline-none focus:bg-white/15 focus:border-neon-pink " +
  "focus:ring-2 focus:ring-neon-pink/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="pink" size="lg" loading={pending} className="w-full">
      Update Password
    </SlayButton>
  );
}

export default function ResetPasswordForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(resetPasswordFormAction, {});

  return (
    <form action={formAction} className="w-full flex flex-col gap-5">
      <h1 className="text-h1 font-black text-white tracking-tight text-center">
        New <span className="text-neon-pink">Password</span>
      </h1>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-label text-white/50 uppercase tracking-widest">New Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-label text-white/50 uppercase tracking-widest">
            Confirm Password
          </span>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            className={INPUT_CLASS}
          />
        </label>
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink text-center">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
