"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import ImageCropField from "./ImageCropField";
import { createDistrict, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="w-full">
      Create District
    </SlayButton>
  );
}

export default function AdminDistrictForm() {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createDistrict, {});
  return (
    <section className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-5">
      <h2 className="mb-4 text-h3 font-bold text-white">New District</h2>
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
        <ImageCropField name="background_image_url" label="Map Background" folder="districts" />
        <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
          <span className="text-body-strong text-white">Published</span>
          <input name="is_published" type="checkbox" className="h-5 w-5 shrink-0 accent-lime-green" />
        </label>
        <Feedback state={state} />
        <SubmitButton />
      </form>
    </section>
  );
}
