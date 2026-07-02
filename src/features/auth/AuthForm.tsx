"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import type { AuthState } from "./actions";

export interface AuthFormProps {
  mode: "login" | "register";
  /** Form-bound server action (useActionState signature). */
  action: (prevState: AuthState, formData: FormData) => Promise<AuthState>;
  /** Pre-filled status message, e.g. after a redirect from password reset. */
  initialMessage?: string;
}

const COPY = {
  login: {
    title: "Log In",
    accent: "In",
    submit: "Log In",
    switchText: "New to Slay City?",
    switchHref: "/auth/register",
    switchCta: "Create an account",
  },
  register: {
    title: "Sign Up",
    accent: "Up",
    submit: "Create Account",
    switchText: "Already have an account?",
    switchHref: "/auth/login",
    switchCta: "Log in",
  },
} as const;

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 caret-neon-pink " +
  "border border-white/20 transition-colors " +
  "focus:outline-none focus:bg-white/15 focus:border-neon-pink " +
  "focus:ring-2 focus:ring-neon-pink/60";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="pink" size="lg" loading={pending} className="w-full">
      {label}
    </SlayButton>
  );
}

export default function AuthForm({ mode, action, initialMessage }: AuthFormProps) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {
    message: initialMessage,
  });
  const isRegister = mode === "register";
  const copy = COPY[mode];

  return (
    <form action={formAction} className="w-full flex flex-col gap-5">
      <h1 className="text-h1 font-black text-white tracking-tight text-center">
        {copy.title.replace(copy.accent, "")}
        <span className="text-neon-pink">{copy.accent}</span>
      </h1>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-label text-white/50 uppercase tracking-widest">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-label text-white/50 uppercase tracking-widest">Password</span>
            {!isRegister && (
              <Link
                href="/auth/forgot-password"
                className="text-xs text-cyan font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="••••••••"
            className={INPUT_CLASS}
          />
        </label>

        {isRegister && (
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
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink text-center">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm font-semibold text-lime-green text-center">
          {state.message}
        </p>
      )}

      <SubmitButton label={copy.submit} />

      <p className="text-sm text-white/50 text-center">
        {copy.switchText}{" "}
        <Link href={copy.switchHref} className="text-cyan font-semibold hover:underline">
          {copy.switchCta}
        </Link>
      </p>
    </form>
  );
}
