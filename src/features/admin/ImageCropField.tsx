"use client";

import Cropper, { type Area } from "react-easy-crop";
import { useRef, useState, type ChangeEvent } from "react";
import "react-easy-crop/react-easy-crop.css";

import { SlayButton } from "@/components/ui";

import { MAP_ASPECT } from "../map/mapConstants";
import { uploadContentImage, type ContentImageFolder } from "./uploadContentImage";

export interface ImageCropFieldProps {
  /** Public URL of the current image, or "" for none. Controlled by the parent. */
  value: string;
  /** Called with the public URL of a newly uploaded image, or "" when removed. */
  onChange: (url: string) => void;
  /** Storage folder the image is uploaded into. */
  folder: ContentImageFolder;
  /** Crop aspect ratio (width / height). Defaults to the map ratio. */
  aspect?: number;
}

/** Reads a File as a data URL for feeding the cropper. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Draws the selected crop region of `src` onto a canvas and returns a JPEG blob. */
async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const image = new Image();
  image.src = src;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not load image."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not export image."))),
      "image/jpeg",
      0.9
    );
  });
}

/**
 * Image upload with an aspect-ratio crop step — used for district backgrounds.
 * The URL lives with the parent, which owns the form field it feeds.
 */
export default function ImageCropField({
  value: url,
  onChange,
  folder,
  aspect = MAP_ASPECT,
}: ImageCropFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editSrc, setEditSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const areaRef = useRef<Area | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await readAsDataUrl(file);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      areaRef.current = null;
      setEditSrc(dataUrl);
    } catch {
      setError("Could not read that file.");
    }
  }

  async function handleApply() {
    if (!editSrc || !areaRef.current) return;
    setUploading(true);
    setError(null);
    try {
      const blob = await cropToBlob(editSrc, areaRef.current);
      const publicUrl = await uploadContentImage(blob, folder, "jpg");
      onChange(publicUrl);
      setEditSrc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="relative w-full overflow-hidden rounded-xl border border-white/15 bg-white/5"
        style={{ aspectRatio: String(aspect) }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-small text-white/30">
            No background
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          {url ? "Replace" : "Upload"}
        </button>
        {url && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs font-semibold text-neon-pink hover:underline"
          >
            Remove
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm font-semibold text-neon-pink">
          {error}
        </p>
      )}

      {/* ── Crop modal ─────────────────────────────────────────────────────── */}
      {editSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-white/10 bg-[#141414] p-5">
            <h3 className="text-h3 font-bold text-white">Crop to map ratio</h3>

            <div
              className="relative w-full overflow-hidden rounded-xl bg-black"
              style={{ aspectRatio: String(aspect) }}
            >
              <Cropper
                image={editSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => {
                  areaRef.current = areaPixels;
                }}
              />
            </div>

            <label className="flex items-center gap-3">
              <span className="text-xs text-white/50">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-lime-green"
              />
            </label>

            {error && (
              <p role="alert" className="text-sm font-semibold text-neon-pink">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <SlayButton
                type="button"
                variant="green"
                size="sm"
                loading={uploading}
                onClick={handleApply}
              >
                Apply
              </SlayButton>
              <SlayButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditSrc(null)}
                disabled={uploading}
              >
                Cancel
              </SlayButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
