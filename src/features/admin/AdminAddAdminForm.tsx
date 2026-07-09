"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { addAdminEmail, type AdminFormState } from "./actions";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 caret-neon-pink " +
  "border border-white/20 transition-colors " +
  "focus:outline-none focus:bg-white/15 focus:border-neon-pink focus:ring-2 focus:ring-neon-pink/60";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="w-full">
      Add Admin
    </SlayButton>
  );
}

export default function AdminAddAdminForm() {
  const [state, formAction] = useActionState<AdminFormState, FormData>(addAdminEmail, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-label text-white/50 uppercase tracking-widest">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="person@example.com"
          className={INPUT_CLASS}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm font-semibold text-lime-green">
          {state.success}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
