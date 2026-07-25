"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { googleFormAction } from "./actions";
import type { AuthState, SignupRole } from "./actions";

export interface AuthFormProps {
  mode: "login" | "register";
  /** Form-bound server action (useActionState signature). */
  action: (prevState: AuthState, formData: FormData) => Promise<AuthState>;
  /** Pre-filled status message, e.g. after a redirect from password reset. */
  initialMessage?: string;
  /** Pre-filled error, e.g. after a failed OAuth round-trip through the callback. */
  initialError?: string;
}

const COPY = {
  login: {
    title: "Log In",
    accent: "In",
    submit: "Log In",
    google: "Continue with Google",
    switchText: "New to Slay City?",
    switchHref: "/auth/register",
    switchCta: "Create an account",
  },
  register: {
    title: "Sign Up",
    accent: "Up",
    submit: "Create Account",
    google: "Sign up with Google",
    switchText: "Already have an account?",
    switchHref: "/auth/login",
    switchCta: "Log in",
  },
} as const;

const ROLE_OPTIONS: { value: SignupRole; label: string }[] = [
  { value: "student", label: "Student" },
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

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
    />
    <path
      fill="#FBBC05"
      d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.32Z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.32C4.68 5.16 6.66 3.58 9 3.58Z"
    />
  </svg>
);

/**
 * Kicks off the Google OAuth flow. Lives inside the main form and overrides its
 * action via `formAction`; `formNoValidate` keeps the empty email/password
 * fields from blocking the submit.
 */
function GoogleButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <SlayButton
      type="submit"
      formAction={googleFormAction}
      formNoValidate
      variant="ghost"
      size="lg"
      disabled={pending}
      iconLeft={<GoogleIcon />}
      className="w-full"
    >
      {label}
    </SlayButton>
  );
}

export default function AuthForm({
  mode,
  action,
  initialMessage,
  initialError,
}: AuthFormProps) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {
    message: initialMessage,
    error: initialError,
  });
  const [role, setRole] = useState<SignupRole>("student");
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
              Student&apos;s Email
            </span>
            <input
              name="studentEmail"
              type="email"
              required
              autoComplete="off"
              placeholder="student@example.com"
              className={INPUT_CLASS}
            />
            <span className="text-xs text-white/40">
              We&apos;ll link your student&apos;s account so you can follow their progress.
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

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-white/15" />
        <span className="text-label text-white/40 uppercase tracking-widest">or</span>
        <span className="h-px flex-1 bg-white/15" />
      </div>

      <GoogleButton label={copy.google} />

      <p className="text-sm text-white/50 text-center">
        {copy.switchText}{" "}
        <Link href={copy.switchHref} className="text-cyan font-semibold hover:underline">
          {copy.switchCta}
        </Link>
      </p>
    </form>
  );
}
