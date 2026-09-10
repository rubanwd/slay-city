"use client";

import { useFormStatus } from "react-dom";

import NavLink from "@/components/ui/NavLink";
import { enterViewAsTeacher } from "@/features/teacher/viewAsActions";

import { revokeTeacher } from "./actions";

export interface TeacherListItemProps {
  id: string;
  username: string;
  groupCount: number;
}

function RevokeButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-neon-pink/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10 disabled:opacity-50"
    >
      {pending ? "Revoking…" : "Revoke"}
    </button>
  );
}

/**
 * One teacher row: jump into their groups, or revoke their teacher role back
 * to parent. Revoke deletes their groups too, so it asks for confirmation
 * before submitting — this cannot be undone.
 */
export default function TeacherListItem({ id, username, groupCount }: TeacherListItemProps) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4">
      <NavLink href={`/admin/teachers/${id}`} className="block">
        <span className="block break-words text-body-strong text-white">{username}</span>
      </NavLink>
      <div className="flex items-center justify-between gap-3">
        <span className="text-small text-white/50">
          {groupCount} {groupCount === 1 ? "group" : "groups"}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <form action={enterViewAsTeacher}>
            <input type="hidden" name="teacher_id" value={id} />
            <button
              type="submit"
              className="rounded-full border border-cyan/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-cyan transition-colors hover:bg-cyan/10"
            >
              View as Teacher
            </button>
          </form>
          <form
            action={revokeTeacher}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  `Revoke ${username}'s teacher role? Their ${groupCount} ${groupCount === 1 ? "group" : "groups"} will be deleted. This cannot be undone.`
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="profile_id" value={id} />
            <RevokeButton />
          </form>
        </div>
      </div>
    </li>
  );
}
