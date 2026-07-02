"use client";

import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { signOut } from "./actions";

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="ghost" size="sm" loading={pending} className={className}>
      Log Out
    </SlayButton>
  );
}

export default function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={signOut}>
      <SubmitButton className={className} />
    </form>
  );
}
