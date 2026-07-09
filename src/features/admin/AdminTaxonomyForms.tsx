"use client";

import { useActionState, useRef, useState, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { createDistrict, createLocation, type AdminFormState } from "./actions";

export interface DistrictOption {
  id: string;
  name: string;
}

function clampPercent(n: number): number {
  return Math.min(100, Math.max(0, n));
}

/** Rounds to one decimal — plenty of precision for a map position. */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 caret-neon-pink " +
  "border border-white/20 transition-colors " +
  "focus:outline-none focus:bg-white/15 focus:border-neon-pink focus:ring-2 focus:ring-neon-pink/60";

const LABEL_CLASS = "text-label text-white/50 uppercase tracking-widest";

function Feedback({ state }: { state: AdminFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm font-semibold text-neon-pink">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="text-sm font-semibold text-lime-green">
        {state.success}
      </p>
    );
  }
  return null;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="w-full">
      {label}
    </SlayButton>
  );
}

function PublishedToggle() {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
      <span className="text-body-strong text-white">Published</span>
      <input name="is_published" type="checkbox" className="h-5 w-5 shrink-0 accent-lime-green" />
    </label>
  );
}

/* ── District form ─────────────────────────────────────────────────────────── */

function DistrictForm() {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createDistrict, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>District Name</span>
        <input name="name" type="text" required placeholder="Downtown" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Description</span>
        <textarea name="description" rows={2} placeholder="Optional" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Order</span>
        <input name="order_index" type="number" min={0} defaultValue={0} className={INPUT_CLASS} />
      </label>
      <PublishedToggle />
      <Feedback state={state} />
      <SubmitButton label="Create District" />
    </form>
  );
}

/* ── Location form ─────────────────────────────────────────────────────────── */

/** Default map position for a new location — dead center, until placed. */
const DEFAULT_POS = { x: 50, y: 50 };

function LocationForm({ districts }: { districts: DistrictOption[] }) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createLocation, {});
  const [pos, setPos] = useState(DEFAULT_POS);
  const previewRef = useRef<HTMLDivElement>(null);
  const xInputRef = useRef<HTMLInputElement>(null);
  const yInputRef = useRef<HTMLInputElement>(null);

  function placeAt(clientX: number, clientY: number) {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    const x = clampPercent(round1(((clientX - rect.left) / rect.width) * 100));
    const y = clampPercent(round1(((clientY - rect.top) / rect.height) * 100));
    setPos({ x, y });
    // Inputs are uncontrolled (avoids the "can't clear the field" glitch of a
    // controlled number input) — sync their displayed value imperatively.
    if (xInputRef.current) xInputRef.current.value = String(x);
    if (yInputRef.current) yInputRef.current.value = String(y);
  }

  function handlePreviewClick(e: MouseEvent<HTMLDivElement>) {
    placeAt(e.clientX, e.clientY);
  }

  /** Keeps the preview dot in sync when X/Y are typed directly. */
  function handleCoordChange() {
    const x = Number(xInputRef.current?.value);
    const y = Number(yInputRef.current?.value);
    setPos({
      x: Number.isFinite(x) ? clampPercent(x) : DEFAULT_POS.x,
      y: Number.isFinite(y) ? clampPercent(y) : DEFAULT_POS.y,
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>District</span>
        {districts.length > 0 ? (
          <select
            name="district_id"
            required
            defaultValue=""
            className={`${INPUT_CLASS} [&>option]:bg-[#1a1a1a] [&>option]:text-white`}
          >
            <option value="" disabled>
              Select a district…
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-small text-amber-300">
            Create a district first.
          </p>
        )}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Location Name</span>
        <input name="name" type="text" required placeholder="Central Café" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Description</span>
        <textarea name="description" rows={2} placeholder="Optional" className={INPUT_CLASS} />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Map Position</span>
        <p className="text-xs text-white/40">
          Click the preview to place the pin, or enter exact percentages below. Without
          this, every new location stacks in the center of the map.
        </p>
        <div
          ref={previewRef}
          onClick={handlePreviewClick}
          className="relative h-40 w-full cursor-crosshair overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-purple/25 via-black to-cyan/10"
        >
          <span
            aria-hidden="true"
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-neon-pink shadow-[0_0_10px_2px_rgba(255,45,142,0.7)] transition-[left,top]"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-white/50">X (0–100)</span>
            <input
              ref={xInputRef}
              name="map_x"
              type="number"
              min={0}
              max={100}
              step={0.1}
              defaultValue={DEFAULT_POS.x}
              onChange={handleCoordChange}
              className={INPUT_CLASS}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-white/50">Y (0–100)</span>
            <input
              ref={yInputRef}
              name="map_y"
              type="number"
              min={0}
              max={100}
              step={0.1}
              defaultValue={DEFAULT_POS.y}
              onChange={handleCoordChange}
              className={INPUT_CLASS}
            />
          </label>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Order</span>
        <input name="order_index" type="number" min={0} defaultValue={0} className={INPUT_CLASS} />
      </label>
      <PublishedToggle />
      <Feedback state={state} />
      <SubmitButton label="Create Location" />
    </form>
  );
}

export default function AdminTaxonomyForms({ districts }: { districts: DistrictOption[] }) {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
        <h2 className="mb-4 text-h3 font-bold text-white">New District</h2>
        <DistrictForm />
      </section>
      <section className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
        <h2 className="mb-4 text-h3 font-bold text-white">New Location</h2>
        <LocationForm districts={districts} />
      </section>
    </div>
  );
}
