"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { knowledgeLevelLabel } from "@/features/levels/levels";

import { useAdminToast } from "./AdminToast";
import type { AdminFormState } from "./actions";
import { INPUT_CLASS } from "./formStyles";
import type { AdminUserView } from "./userQueries";
import { deleteUser, setUserRole } from "./userActions";
import {
  USER_ROLES,
  USER_ROLE_BADGE_CLASS,
  USER_ROLE_LABELS,
  formatUserDate,
  userRoleLabel,
} from "./userRoles";

export interface AdminUserItemProps {
  user: AdminUserView;
  /** The signed-in admin — their own row loses the role picker and Delete. */
  isSelf: boolean;
}

function SaveRoleButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="shrink-0 rounded-full border border-lime-green/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-lime-green transition-colors hover:bg-lime-green/10 disabled:cursor-not-allowed disabled:border-white/15 disabled:text-white/30 disabled:hover:bg-transparent"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full border border-neon-pink/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

/**
 * One account in the admin user list: who they are, when they joined, and the
 * two things an admin can do to them — change their role or delete the account.
 * An admin never sees either control on their own row; the RPCs refuse those
 * calls anyway, and hiding them says why before the click.
 */
export default function AdminUserItem({ user, isSelf }: AdminUserItemProps) {
  const [roleState, roleAction] = useActionState<AdminFormState, FormData>(setUserRole, {});
  const [deleteState, deleteAction] = useActionState<AdminFormState, FormData>(deleteUser, {});
  const [role, setRole] = useState<string>(user.role ?? "student");
  const [knownRole, setKnownRole] = useState(user.role);
  const toast = useAdminToast();

  // The row re-renders from fresh server data after a change (this admin's or
  // another's); adjust the picker during render so it never shows a role the
  // account no longer has. https://react.dev/reference/react/useState#storing-information-from-previous-renders
  if (knownRole !== user.role) {
    setKnownRole(user.role);
    setRole(user.role ?? "student");
  }

  useEffect(() => {
    if (roleState.error) toast.error(roleState.error);
    if (roleState.success) toast.success(roleState.success);
  }, [roleState, toast]);

  useEffect(() => {
    if (deleteState.error) toast.error(deleteState.error);
    if (deleteState.success) toast.success(deleteState.success);
  }, [deleteState, toast]);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="break-words text-body-strong text-white">
            {user.username ?? "Unnamed account"}
          </span>
          <span
            className={[
              "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
              user.role ? USER_ROLE_BADGE_CLASS[user.role] : "bg-white/10 text-white/50",
            ].join(" ")}
          >
            {userRoleLabel(user.role)}
          </span>
          {isSelf && (
            <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white/60">
              You
            </span>
          )}
          {!user.isConfirmed && (
            <span className="shrink-0 rounded-md bg-neon-orange/20 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-neon-orange">
              Unconfirmed
            </span>
          )}
        </span>
        <span className="break-all text-small text-white/60">{user.email ?? "No email"}</span>
        <span className="text-small text-white/40">
          Joined {formatUserDate(user.createdAt)}
          {user.role === "student" && user.level ? ` · ${knowledgeLevelLabel(user.level)}` : ""}
          {!user.hasProfile ? " · never finished onboarding" : ""}
        </span>
      </div>

      {!isSelf && (
        <>
          <form action={roleAction} className="flex items-center gap-2">
            <input type="hidden" name="profile_id" value={user.id} />
            <select
              name="role"
              aria-label={`Role for ${user.username ?? user.email ?? "this account"}`}
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className={`${INPUT_CLASS} min-w-0 flex-1 py-2 text-small`}
            >
              {USER_ROLES.map((value) => (
                <option key={value} value={value} className="bg-[#1a1a1a]">
                  {USER_ROLE_LABELS[value]}
                </option>
              ))}
            </select>
            <SaveRoleButton disabled={role === user.role} />
          </form>

          <form
            action={deleteAction}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  `Delete ${user.username ?? user.email ?? "this account"}? Their progress, stats and wardrobe go with it. This cannot be undone.`
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="profile_id" value={user.id} />
            <DeleteButton />
          </form>
        </>
      )}
    </li>
  );
}
