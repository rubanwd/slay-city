import type { Json } from "@/types/database";

import type { MissionTaskType } from "./taskTypes";

/**
 * Image support, per task type, so the admin list can flag tasks whose artwork
 * is still missing and the editors know which fields get an AI "generate"
 * button. A task type is either:
 *   - "single": one optional/required `imageUrl` on the content, or
 *   - "cards" / "pairs": one image per item in a list.
 *
 * `required` types (picture_reveal, and matching in word-to-image mode) don't
 * render in a mission until their image exists — those get a louder badge.
 */
type ImageShape = "single" | "cards" | "pairs";

interface ImageMeta {
  shape: ImageShape;
  /** True when the task can't be played until its image(s) exist. */
  required: boolean;
}

const IMAGE_TASK_META: Partial<Record<MissionTaskType, ImageMeta>> = {
  vocabulary: { shape: "single", required: false },
  quiz: { shape: "single", required: false },
  true_false: { shape: "single", required: false },
  word_scramble: { shape: "single", required: false },
  picture_reveal: { shape: "single", required: true },
  flashcards: { shape: "cards", required: false },
  // matching only uses images in word-to-image mode; handled in the reader below.
  matching: { shape: "pairs", required: true },
};

export interface TaskImageStatus {
  /** This task type can carry artwork. */
  imageType: boolean;
  /** Total image slots (1 for single types, item count for lists). */
  total: number;
  /** Slots still without an image. */
  missing: number;
  /** True when the missing image(s) block the task from playing. */
  required: boolean;
}

const NOT_IMAGE: TaskImageStatus = { imageType: false, total: 0, missing: 0, required: false };

function isRecord(value: Json | null | undefined): value is { [key: string]: Json } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasUrl(value: Json | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Inspects a task's raw JSONB content and reports how many image slots it has
 * and how many are still empty. Reads the content generically (not via the
 * strict parsers) so a task that's *missing* its required image — and therefore
 * fails parsing — is still reported instead of silently treated as complete.
 */
export function taskImageStatus(taskType: MissionTaskType, content: Json): TaskImageStatus {
  const meta = IMAGE_TASK_META[taskType];
  if (!meta) return NOT_IMAGE;
  const record = isRecord(content) ? content : {};

  if (taskType === "matching") {
    // Images only exist in word-to-image mode; word-to-translation is text-only.
    if (record.mode !== "word-to-image") return NOT_IMAGE;
    const pairs = Array.isArray(record.pairs) ? record.pairs : [];
    const total = pairs.length;
    const filled = pairs.filter((p) => isRecord(p) && hasUrl(p.match)).length;
    return { imageType: true, total, missing: total - filled, required: true };
  }

  if (meta.shape === "cards") {
    const cards = Array.isArray(record.cards) ? record.cards : [];
    const total = cards.length;
    const filled = cards.filter((c) => isRecord(c) && hasUrl(c.imageUrl ?? c.image_url)).length;
    return { imageType: true, total, missing: total - filled, required: meta.required };
  }

  // single image slot
  const filled = hasUrl(record.imageUrl ?? record.image_url);
  return { imageType: true, total: 1, missing: filled ? 0 : 1, required: meta.required };
}
