"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import type { AuthState, SignupRole } from "./actions";

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

const ROLE_OPTIONS: { value: SignupRole; label: string }[] = [
  { value: "child", label: "Child" },
  { value: "parent", label: "Parent" },
];

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
  const [role, setRole] = useState<SignupRole>("child");
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

        {isRegister && (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-label text-white/50 uppercase tracking-widest">
              I am a
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((option) => (
                <label key={option.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={() => setRole(option.value)}
                    className="peer sr-only"
                  />
                  <span
                    className={[
                      "block rounded-xl border px-4 py-3 text-center text-sm font-semibold transition-colors",
                      "border-white/20 text-white/60",
                      "peer-checked:border-neon-pink peer-checked:bg-neon-pink/10 peer-checked:text-white",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-neon-pink/60",
                    ].join(" ")}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {isRegister && role === "parent" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-label text-white/50 uppercase tracking-widest">
              Child&apos;s Email
            </span>
            <input
              name="childEmail"
              type="email"
              required
              autoComplete="off"
              placeholder="child@example.com"
              className={INPUT_CLASS}
            />
            <span className="text-xs text-white/40">
              We&apos;ll link your child&apos;s account so you can follow their progress.
            </span>
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
