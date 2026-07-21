"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import NavLink from "@/components/ui/NavLink";
import { INPUT_CLASS, LABEL_CLASS } from "@/features/admin/formStyles";
import ImageUploadField from "@/features/admin/ImageUploadField";

import { deleteHomeworkTopic, updateHomeworkTopic, type TeacherFormState } from "./actions";

export interface HomeworkTopicItemProps {
  groupId: string;
  topic: {
    id: string;
    title: string;
    description: string | null;
    order_index: number;
    note_text: string | null;
    note_link_url: string | null;
    note_image_url: string | null;
  };
  /** How many vocabulary words the topic has. */
  wordCount: number;
  /** How many grammar rule points the topic has. */
  grammarCount: number;
  /** False when already on the topic's own tasks page — the title shouldn't link to itself. */
  linkToTasks?: boolean;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="sm" loading={pending}>
      Save
    </SlayButton>
  );
}

/** One lesson topic row: edit (inline) or delete, and a link into its tasks. */
export default function HomeworkTopicItem({
  groupId,
  topic,
  wordCount,
  grammarCount,
  linkToTasks = true,
}: HomeworkTopicItemProps) {
  // On a topic's own page (linkToTasks === false) the info form is the whole
  // point of the section, so it stays permanently open — no collapse into a
  // summary, no Edit/Cancel. In the group's topic list it's still edit-on-demand.
  const alwaysExpanded = !linkToTasks;
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState<TeacherFormState, FormData>(updateHomeworkTopic, {});

  if (alwaysExpanded || editing) {
    return (
      <li className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={topic.id} />
          <input type="hidden" name="group_id" value={groupId} />
          <input type="hidden" name="order_index" value={topic.order_index} />

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Topic Title</span>
            <input
              name="title"
              type="text"
              required
              defaultValue={topic.title}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Description (optional)</span>
            <textarea
              name="description"
              rows={3}
              defaultValue={topic.description ?? ""}
              className={INPUT_CLASS}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Extra Info (optional)</span>
            <textarea
              name="note_text"
              rows={3}
              defaultValue={topic.note_text ?? ""}
              placeholder="Anything else the student should know before starting"
              className={INPUT_CLASS}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Link (optional)</span>
            <input
              name="note_link_url"
              type="url"
              defaultValue={topic.note_link_url ?? ""}
              placeholder="https://..."
              className={INPUT_CLASS}
            />
          </label>

          <ImageUploadField
            name="note_image_url"
            label="Image (optional)"
            folder="homework"
            defaultValue={topic.note_image_url}
          />

          {state.error && (
            <p role="alert" className="text-sm font-semibold text-neon-pink">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <SaveButton />
            {!alwaysExpanded && (
              <SlayButton type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </SlayButton>
            )}
          </div>
        </form>
      </li>
    );
  }

  const body = (
    <>
      <p className="truncate text-body-strong text-white">{topic.title}</p>
      {topic.description && (
        <p className="mt-0.5 truncate text-small text-white/50">{topic.description}</p>
      )}
      <div className="mt-1 flex items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-cyan">
          {wordCount} {wordCount === 1 ? "word" : "words"} · {grammarCount}{" "}
          {grammarCount === 1 ? "rule" : "rules"}
        </p>
        {(topic.note_text || topic.note_link_url || topic.note_image_url) && (
          <span className="text-xs text-white/40" title="Has extra info for students">
            📎
          </span>
        )}
      </div>
    </>
  );

  return (
    <li className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4">
      {linkToTasks ? (
        <NavLink href={`/teacher/groups/${groupId}/topics/${topic.id}`} className="block">
          {body}
        </NavLink>
      ) : (
        <div>{body}</div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/60 transition-colors hover:bg-white/10"
        >
          Edit
        </button>
        <form
          action={deleteHomeworkTopic}
          onSubmit={(e) => {
            if (!window.confirm("Delete this topic and all its tasks? This cannot be undone.")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={topic.id} />
          <input type="hidden" name="group_id" value={groupId} />
          <button
            type="submit"
            className="w-full rounded-full border border-neon-pink/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10"
          >
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}
