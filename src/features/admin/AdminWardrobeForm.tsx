"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";
import { WARDROBE_CATEGORIES, WARDROBE_CATEGORY_META } from "@/features/wardrobe/categories";

import ImageUploadField from "./ImageUploadField";
import { createWardrobeItem, updateWardrobeItem, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

export interface WardrobeItemFormData {
  id: string;
  name: string;
  item_type: string;
  cost_coins: number;
  unlock_level: number | null;
  image_url: string | null;
  order_index: number;
  is_published: boolean;
}

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
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="flex-1">
      {label}
    </SlayButton>
  );
}

export type AdminWardrobeFormProps =
  | { mode: "create"; item?: undefined; onCancel?: undefined; onSaved?: undefined }
  | {
      mode: "edit";
      item: WardrobeItemFormData;
      onCancel: () => void;
      /** Called once after a successful save, so the parent can collapse the editor. */
      onSaved: () => void;
    };

/**
 * Create/edit form for a wardrobe item. In "create" mode it posts to
 * {@link createWardrobeItem}; in "edit" mode it carries a hidden id and posts to
 * {@link updateWardrobeItem}, with a Cancel button supplied by the parent row.
 */
export default function AdminWardrobeForm({
  mode,
  item,
  onCancel,
  onSaved,
}: AdminWardrobeFormProps) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(
    mode === "create" ? createWardrobeItem : updateWardrobeItem,
    {}
  );

  // Collapse the inline editor once the save succeeds. `onSaved` is only
  // supplied in edit mode; the persistent create form stays open.
  useEffect(() => {
    if (state.success) onSaved?.();
  }, [state.success, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "edit" && <input type="hidden" name="id" value={item.id} />}

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Item Name</span>
        <input
          name="name"
          type="text"
          required
          placeholder="Neon Beanie"
          defaultValue={item?.name}
          className={INPUT_CLASS}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Category</span>
          <select
            name="item_type"
            required
            defaultValue={item?.item_type ?? "hat"}
            className={`${INPUT_CLASS} [&>option]:bg-[#1a1a1a] [&>option]:text-white`}
          >
            {WARDROBE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {WARDROBE_CATEGORY_META[cat].label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Price (coins)</span>
          <input
            name="cost_coins"
            type="number"
            min={0}
            required
            defaultValue={item?.cost_coins ?? 0}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Unlock Level</span>
          <input
            name="unlock_level"
            type="number"
            min={1}
            placeholder="Any"
            defaultValue={item?.unlock_level ?? ""}
            className={INPUT_CLASS}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS}>Order</span>
          <input
            name="order_index"
            type="number"
            min={0}
            defaultValue={item?.order_index ?? 0}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <ImageUploadField
        name="image_url"
        label="Item Image"
        folder="wardrobe"
        defaultValue={item?.image_url}
      />

      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
        <span className="text-body-strong text-white">Published</span>
        <input
          name="is_published"
          type="checkbox"
          defaultChecked={item?.is_published ?? false}
          className="h-5 w-5 shrink-0 accent-lime-green"
        />
      </label>

      <Feedback state={state} />

      <div className="flex gap-2">
        <SubmitButton label={mode === "create" ? "Create Item" : "Save"} />
        {mode === "edit" && (
          <SlayButton type="button" variant="ghost" size="md" onClick={onCancel}>
            Cancel
          </SlayButton>
        )}
      </div>
    </form>
  );
}
