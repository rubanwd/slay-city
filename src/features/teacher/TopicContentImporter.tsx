"use client";

import { useState } from "react";

import { SlayButton } from "@/components/ui";
import { INPUT_CLASS, LABEL_CLASS } from "@/features/admin/formStyles";

import { describeSource, type TopicContentKind, type TopicSource } from "./topicSources";

const SELECT_CLASS =
  `${INPUT_CLASS} !py-2 text-small ` + "[&>option]:bg-[#1a1a1a] [&>option]:text-white";

export interface TopicContentImporterProps {
  /** Topics that already carry content of this kind, from any of the teacher's groups. */
  sources: TopicSource[];
  kind: TopicContentKind;
  /** Disables the picker while the manager is generating/publishing. */
  disabled?: boolean;
  /** Spinner state while the chosen topic's content is being loaded. */
  loading?: boolean;
  /** Called with the picked topic id — the parent loads it into its draft. */
  onImport: (sourceTopicId: string) => void;
}

/**
 * The third authoring mode on a homework topic, next to "Generate with AI" and
 * adding entries by hand: copy the content of a topic the teacher already
 * authored for another group. The same topic is usually taught to several
 * groups, so this saves re-drafting (and re-paying for) identical content.
 *
 * Purely a picker — it hands the chosen topic id to the parent manager, which
 * loads it into the editable draft. Nothing is written until the teacher hits
 * Publish, exactly like the AI flow.
 */
export default function TopicContentImporter({
  sources,
  kind,
  disabled = false,
  loading = false,
  onImport,
}: TopicContentImporterProps) {
  const [selected, setSelected] = useState("");

  const noun = kind === "vocabulary" ? "vocabulary" : "grammar";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
      <span className={LABEL_CLASS}>Copy from another topic</span>
      {sources.length === 0 ? (
        <p className="text-[11px] text-white/40">
          None of your other topics has {noun} yet — publish one and you can reuse it here.
        </p>
      ) : (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-white/50">Existing topic</span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={disabled || loading}
              className={SELECT_CLASS}
            >
              <option value="">Pick a topic…</option>
              {sources.map((source) => (
                <option key={source.topicId} value={source.topicId}>
                  {describeSource(source, kind)}
                </option>
              ))}
            </select>
          </label>
          <SlayButton
            type="button"
            variant="ghost"
            size="md"
            loading={loading}
            disabled={disabled || loading || !selected}
            onClick={() => selected && onImport(selected)}
          >
            Copy {noun} here
          </SlayButton>
          <p className="text-[11px] text-white/30">
            Loads that topic&apos;s {noun} into the list below for review — publish to apply it.
          </p>
        </>
      )}
    </div>
  );
}
