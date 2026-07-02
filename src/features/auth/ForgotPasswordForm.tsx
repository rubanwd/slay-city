"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { forgotPasswordFormAction, type AuthState } from "./actions";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 caret-neon-pink " +
  "border border-white/20 transition-colors " +
  "focus:outline-none focus:bg-white/15 focus:border-neon-pink " +
  "focus:ring-2 focus:ring-neon-pink/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="pink" size="lg" loading={pending} className="w-full">
      Send Reset Link
    </SlayButton>
  );
}

export default function ForgotPasswordForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(forgotPasswordFormAction, {});

  return (
    <form action={formAction} className="w-full flex flex-col gap-5">
      <h1 className="text-h1 font-black text-white tracking-tight text-center">
        Reset <span className="text-neon-pink">Password</span>
      </h1>

      <p className="text-sm text-white/50 text-center">
        Enter the email on your account and we&apos;ll send you a link to reset your password.
      </p>

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

      <SubmitButton />

      <p className="text-sm text-white/50 text-center">
        Remembered it?{" "}
        <Link href="/auth/login" className="text-cyan font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
