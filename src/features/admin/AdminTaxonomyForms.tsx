"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import { createDistrict, createLocation, type AdminFormState } from "./actions";

export interface DistrictOption {
  id: string;
  name: string;
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

function LocationForm({ districts }: { districts: DistrictOption[] }) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createLocation, {});
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
