"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import {
  KNOWLEDGE_LEVELS,
  KNOWLEDGE_LEVEL_LABELS,
  DEFAULT_KNOWLEDGE_LEVEL,
} from "@/features/levels/levels";

import { useAdminModalControls } from "./AdminModal";
import { useAdminToast } from "./AdminToast";
import type { AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";
import { createUser } from "./userActions";
import { USER_ROLES, USER_ROLE_LABELS } from "./userRoles";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="flex-1">
      Add User
    </SlayButton>
  );
}

/**
 * Creates a real account — email, password, name and role — from the console.
 * The knowledge level only appears for students, since it's the only role that
 * studies a curriculum.
 */
export default function AdminAddUserForm() {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createUser, {});
  const [role, setRole] = useState<string>("student");
  const modal = useAdminModalControls();
  const toast = useAdminToast();

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error, toast]);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      modal?.close();
    }
  }, [state.success, toast, modal]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          placeholder="person@example.com"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Password</span>
        <input
          name="password"
          type="text"
          required
          minLength={6}
          autoComplete="off"
          placeholder="At least 6 characters"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Username</span>
        <input
          name="username"
          type="text"
          required
          autoComplete="off"
          placeholder="Their name in the game"
          className={INPUT_CLASS}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Role</span>
        <select
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className={INPUT_CLASS}
        >
          {USER_ROLES.map((value) => (
            <option key={value} value={value} className="bg-[#1a1a1a]">
              {USER_ROLE_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      {role === "student" && (
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Knowledge level</span>
          <select name="level" defaultValue={DEFAULT_KNOWLEDGE_LEVEL} className={INPUT_CLASS}>
            {KNOWLEDGE_LEVELS.map((value) => (
              <option key={value} value={value} className="bg-[#1a1a1a]">
                {KNOWLEDGE_LEVEL_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
      )}

      <p className="text-xs text-white/40">
        Give them this password — they can change it later from the login screen. If the project
        requires email confirmation, they must confirm before their first sign-in.
      </p>

      <div className="flex gap-2">
        <SubmitButton />
        {modal && (
          <SlayButton type="button" variant="ghost" size="md" onClick={() => modal.close()}>
            Cancel
          </SlayButton>
        )}
      </div>
    </form>
  );
}
