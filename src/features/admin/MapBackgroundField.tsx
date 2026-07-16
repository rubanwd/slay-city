"use client";

import { useRef, useState } from "react";

import { SlayButton } from "@/components/ui";

import { MAP_ASPECT } from "../map/mapConstants";
import ImageCropField from "./ImageCropField";
import { generateMapBackground } from "./generateMapBackground";
import { type MapBackgroundLocation } from "./mapBackgroundPrompt";
import { uploadContentImage } from "./uploadContentImage";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

export interface MapBackgroundFieldProps {
  /** Name of the hidden input carrying the background's public URL. */
  name: string;
  label: string;
  /** Existing URL when editing. */
  defaultValue?: string | null;
  /**
   * Locations already added to this district, fed to the AI prompt so the
   * generated art has a landmark for each one. Empty for a district that does
   * not exist yet.
   */
  locations?: MapBackgroundLocation[];
}

/** One AI attempt. `uploadedUrl` is set once it has been pushed to storage. */
interface Candidate {
  dataUrl: string;
  uploadedUrl?: string;
}

type Source = "upload" | "ai";

/** Turns a model-returned data URL into a blob plus the extension for storage. */
async function dataUrlToUpload(dataUrl: string): Promise<{ blob: Blob; ext: string }> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === "image/jpeg" ? "jpg" : blob.type === "image/webp" ? "webp" : "png";
  return { blob, ext };
}

const TAB_BASE =
  "flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors";

/**
 * Map Background picker for the district forms. The admin either uploads and
 * crops an image by hand, or generates one with AI — the generator panel only
 * appears once that source is chosen.
 *
 * Both sources feed one hidden input, so the district actions keep reading a
 * single `background_image_url`. An AI candidate is only uploaded to storage
 * when the admin picks it, which lets them regenerate freely and go back to an
 * earlier attempt they preferred without littering the bucket.
 */
export default function MapBackgroundField({
  name,
  label,
  defaultValue,
  locations = [],
}: MapBackgroundFieldProps) {
  const [url, setUrl] = useState<string>(defaultValue ?? "");
  const [source, setSource] = useState<Source>("upload");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [index, setIndex] = useState(0);
  const [extraInstructions, setExtraInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const current = candidates[index];

  /**
   * Reads the district's name and description straight from the surrounding
   * form, so generation uses what the admin has typed rather than what was last
   * saved.
   */
  function readDistrictFields(): { name: string; description: string } {
    const form = rootRef.current?.closest("form");
    if (!form) return { name: "", description: "" };
    const data = new FormData(form);
    return {
      name: String(data.get("name") ?? ""),
      description: String(data.get("description") ?? ""),
    };
  }

  async function handleGenerate() {
    const district = readDistrictFields();
    if (!district.name.trim()) {
      setError("Enter the district name first — the prompt is built from it.");
      return;
    }

    setGenerating(true);
    setError(null);
    // Read before awaiting: only one generation runs at a time (the button is
    // disabled meanwhile), so this is the index the new attempt will land on.
    const nextIndex = candidates.length;

    const result = await generateMapBackground({
      districtName: district.name,
      districtDescription: district.description,
      locations,
      extraInstructions,
    });

    if (result.ok) {
      setCandidates((prev) => [...prev, { dataUrl: result.dataUrl }]);
      setIndex(nextIndex);
    } else {
      setError(result.error);
    }
    setGenerating(false);
  }

  /** Uploads the shown attempt and makes it the district's background. */
  async function handleApply() {
    if (!current) return;
    if (current.uploadedUrl) {
      setUrl(current.uploadedUrl);
      return;
    }

    setApplying(true);
    setError(null);
    try {
      const { blob, ext } = await dataUrlToUpload(current.dataUrl);
      const publicUrl = await uploadContentImage(blob, "districts", ext);
      setCandidates((prev) =>
        prev.map((c, i) => (i === index ? { ...c, uploadedUrl: publicUrl } : c))
      );
      setUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that image.");
    } finally {
      setApplying(false);
    }
  }

  const isApplied = Boolean(current?.uploadedUrl && current.uploadedUrl === url);
  const busy = generating || applying;

  return (
    <div ref={rootRef} className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>{label}</span>
      <input type="hidden" name={name} value={url} />

      {/* ── Source switch ──────────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label="Background source"
        className="flex gap-1 rounded-xl border border-white/15 bg-white/5 p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={source === "upload"}
          onClick={() => setSource("upload")}
          className={[
            TAB_BASE,
            source === "upload" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80",
          ].join(" ")}
        >
          Upload
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={source === "ai"}
          onClick={() => setSource("ai")}
          className={[
            TAB_BASE,
            source === "ai" ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80",
          ].join(" ")}
        >
          Generate with AI
        </button>
      </div>

      {source === "upload" ? (
        <ImageCropField value={url} onChange={setUrl} folder="districts" />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Preview: the attempt being reviewed, else whatever is currently set. */}
          <div
            className="relative w-full overflow-hidden rounded-xl border border-white/15 bg-white/5"
            style={{ aspectRatio: String(MAP_ASPECT) }}
          >
            {current || url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current?.dataUrl ?? url}
                alt={current ? `AI background attempt ${index + 1}` : "Current map background"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center px-6 text-center text-small text-white/30">
                {generating ? "Generating…" : "No background yet"}
              </span>
            )}

            {generating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="text-small font-bold text-lime-green">Generating…</span>
              </div>
            )}

            {isApplied && !generating && (
              <span className="absolute left-2 top-2 rounded-md bg-lime-green px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black">
                Selected
              </span>
            )}
          </div>

          {/* Attempt history — regenerate freely, then come back to a favourite. */}
          {candidates.length > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0 || busy}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                ‹ Prev
              </button>
              <span className="text-xs font-semibold text-white/50">
                Attempt {index + 1} / {candidates.length}
              </span>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.min(candidates.length - 1, i + 1))}
                disabled={index === candidates.length - 1 || busy}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-white/70 transition-colors hover:bg-white/10 disabled:opacity-30"
              >
                Next ›
              </button>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className={LABEL_CLASS}>Extra prompt details</span>
            <textarea
              rows={3}
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              placeholder="e.g. rainy night, more skateboard ramps, big neon donut sign over the plaza"
              className={INPUT_CLASS}
            />
            <span className="text-xs text-white/40">
              The district name{locations.length > 0 ? `, its ${locations.length} location(s),` : ""}{" "}
              map size and the SLAY CITY art style are already in the prompt. Add anything else here.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <SlayButton
              type="button"
              variant="pink"
              size="sm"
              loading={generating}
              disabled={applying}
              onClick={handleGenerate}
            >
              {candidates.length === 0 ? "Generate" : "Regenerate"}
            </SlayButton>

            {current && !isApplied && (
              <SlayButton
                type="button"
                variant="green"
                size="sm"
                loading={applying}
                disabled={generating}
                onClick={handleApply}
              >
                Use this one
              </SlayButton>
            )}

            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                disabled={busy}
                className="text-xs font-semibold text-neon-pink hover:underline disabled:opacity-40"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink">
          {error}
        </p>
      )}
    </div>
  );
}
