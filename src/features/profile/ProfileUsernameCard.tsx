"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { SlayButton } from "@/components/ui";

import { changeMyUsername } from "./actions";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  normalizeUsername,
  type UsernameCardMessages,
  type UsernameProblem,
} from "./username";

export interface ProfileUsernameCardProps {
  /** The name on the profile row right now. */
  username: string | null;
  /**
   * The caller's own message namespace — student, teacher (same namespace as
   * student today), or parent — so the card speaks whatever language that
   * screen already renders in.
   */
  messages: UsernameCardMessages;
}

/**
 * Lets a signed-in user rename themselves from their own profile — student,
 * teacher, or parent. The name is chosen in a hurry at signup, so typos and
 * outgrown nicknames are common; this is the only way to fix one without a
 * new account.
 *
 * Collapsed by default: the card shows the current name and a Change button, so
 * the profile screen keeps its single obvious primary action.
 */
export default function ProfileUsernameCard({ username, messages }: ProfileUsernameCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(username ?? "");
  const [problem, setProblem] = useState<UsernameProblem | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  // The server-confirmed name. The page re-renders with it too, but keeping it
  // here means the card never flashes the old name while that happens.
  const [current, setCurrent] = useState(username ?? "");

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function openEditor() {
    setValue(current);
    setProblem(null);
    setSaved(false);
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const next = value;
    startTransition(async () => {
      const result = await changeMyUsername(next);
      if (!result.ok) {
        setProblem(result.problem);
        return;
      }
      setCurrent(result.username);
      setValue(result.username);
      setProblem(null);
      setSaved(true);
      setOpen(false);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="text-label uppercase tracking-widest text-white/50">
            {messages.usernameTitle}
          </span>
          <span className="text-body-strong font-bold text-white break-words">{current}</span>
        </span>

        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openEditor())}
          disabled={pending}
          className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {open ? messages.usernameCancel : messages.usernameChange}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            ref={inputRef}
            name="username"
            type="text"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setProblem(null);
            }}
            required
            minLength={USERNAME_MIN_LENGTH}
            maxLength={USERNAME_MAX_LENGTH}
            disabled={pending}
            aria-label={messages.usernameTitle}
            aria-invalid={problem !== null}
            className={[
              "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white",
              "caret-neon-pink transition-colors focus:border-neon-pink focus:bg-white/15",
              "focus:outline-none focus:ring-2 focus:ring-neon-pink/60 disabled:opacity-50",
            ].join(" ")}
          />
          <p className="text-small text-white/40">{messages.usernameHint}</p>

          <SlayButton
            type="submit"
            variant="green"
            size="sm"
            loading={pending}
            disabled={normalizeUsername(value) === current}
            className="w-full"
          >
            {pending ? messages.usernameSaving : messages.usernameSave}
          </SlayButton>
        </form>
      )}

      {saved && !open && (
        <p className="text-small font-semibold text-lime-green" aria-live="polite">
          {messages.usernameSaved}
        </p>
      )}
      {problem && (
        <p role="alert" className="text-small font-semibold text-neon-pink">
          {messages.usernameErrors[problem]}
        </p>
      )}
    </div>
  );
}
