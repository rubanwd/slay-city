"use client";

import { useEffect, useState } from "react";

import type { Json } from "@/types/database";

import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";
import { TASK_EDITORS } from "./taskEditors";
import type { MissionTaskType } from "./taskTypes";

export interface AdminTaskContentFieldsProps {
  taskType: MissionTaskType;
  /** Existing content when editing a task of this same type. Omit for a new task. */
  initialContent?: Json;
  /**
   * Notified with the current content (guided object or parsed raw JSON, `null`
   * when the raw JSON is malformed) whenever it changes. Lets a parent preview or
   * test-run the task with exactly what's in the form.
   */
  onContentChange?: (content: Json | null) => void;
}

function isRecord(value: Json | undefined): value is { [key: string]: Json } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Renders a guided, type-specific form for a task's content (with a raw-JSON
 * escape hatch), and mirrors whichever mode is active into a hidden `content`
 * field so the surrounding `<form>` still submits a single JSON string, matching
 * what `createMissionTask`/`updateMissionTask` expect.
 *
 * Each task type's guided editor lives in the `taskEditors` registry; a type
 * without a registered editor shows the raw JSON editor only.
 */
export default function AdminTaskContentFields({
  taskType,
  initialContent,
  onContentChange,
}: AdminTaskContentFieldsProps) {
  const entry = TASK_EDITORS[taskType];
  const supportsGuided = Boolean(entry);

  const hasExistingContent = isRecord(initialContent) && Object.keys(initialContent).length > 0;
  const initialParseFailed =
    hasExistingContent && supportsGuided && entry!.parse(initialContent!) === null;

  const [mode, setMode] = useState<"guided" | "raw">(
    !supportsGuided || initialParseFailed ? "raw" : "guided"
  );
  const [rawJson, setRawJson] = useState(
    initialContent !== undefined ? JSON.stringify(initialContent, null, 2) : ""
  );

  // Content built by the active guided editor; mirrored into the hidden input.
  const [guided, setGuided] = useState<Record<string, unknown>>(
    isRecord(initialContent) ? initialContent : {}
  );
  // Editor remount seed + the content it should (re)initialize from. Bumping the
  // seed on raw→guided lets the editor re-seed its fields from edited JSON.
  const [editorSeed, setEditorSeed] = useState(0);
  const [editorInitial, setEditorInitial] = useState<Json | undefined>(initialContent);

  // Mirror the active content to an optional observer (guided object, or parsed
  // raw JSON — `null` when the raw JSON is malformed). The string snapshot is the
  // real dep so a new-but-equal object doesn't re-fire.
  const activeContent = mode === "raw" ? rawJson : JSON.stringify(guided);
  useEffect(() => {
    if (!onContentChange) return;
    try {
      onContentChange(JSON.parse(activeContent || "{}") as Json);
    } catch {
      onContentChange(null);
    }
  }, [activeContent, onContentChange]);

  function switchToRaw() {
    setRawJson(JSON.stringify(guided, null, 2));
    setMode("raw");
  }

  function switchToGuided() {
    let parsed: Json | undefined = editorInitial;
    try {
      parsed = JSON.parse(rawJson || "{}") as Json;
    } catch {
      // Keep the last known-good content when the raw JSON is malformed.
    }
    setEditorInitial(parsed);
    setEditorSeed((seed) => seed + 1);
    setMode("guided");
  }

  if (!supportsGuided) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Content (JSON)</span>
        <textarea
          name="content"
          rows={6}
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          className={`${INPUT_CLASS} font-mono text-small`}
        />
        <span className="text-xs text-white/40">
          This task type doesn&apos;t have a guided editor yet — enter content as JSON.
        </span>
      </div>
    );
  }

  const Editor = entry!.Editor;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={LABEL_CLASS}>Content</span>
        <button
          type="button"
          onClick={mode === "guided" ? switchToRaw : switchToGuided}
          className="text-xs font-bold uppercase tracking-wide text-cyan hover:underline"
        >
          {mode === "guided" ? "Edit as raw JSON" : "Use guided form"}
        </button>
      </div>

      {mode === "raw" ? (
        <textarea
          name="content"
          rows={8}
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          className={`${INPUT_CLASS} font-mono text-small`}
        />
      ) : (
        <>
          <input type="hidden" name="content" value={JSON.stringify(guided)} readOnly />
          <Editor key={editorSeed} initialContent={editorInitial} onChange={setGuided} />
        </>
      )}
    </div>
  );
}
