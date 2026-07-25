"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";

import { SlayButton } from "@/components/ui";

import LocationIconField from "./LocationIconField";
import MapPositionPicker from "./MapPositionPicker";
import { useAdminModalControls } from "./AdminModal";
import { useAdminToast } from "./AdminToast";
import { createLocation, type AdminFormState } from "./actions";
import { INPUT_CLASS, LABEL_CLASS } from "./formStyles";

export interface DistrictOption {
  id: string;
  name: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <SlayButton type="submit" variant="green" size="md" loading={pending} className="flex-1">
      Create Location
    </SlayButton>
  );
}

export interface AdminLocationFormProps {
  /** Districts to choose from. Ignored when {@link fixedDistrictId} is set. */
  districts?: DistrictOption[];
  /** When set, the district is fixed (drill-down from a district) — no dropdown is shown. */
  fixedDistrictId?: string;
  /** The district's background, shown in the position picker to match the student's map. */
  districtBackgroundUrl?: string | null;
  /** The district's name, fed to the AI icon prompt for scene context. */
  districtName?: string;
}

export default function AdminLocationForm({
  districts = [],
  fixedDistrictId,
  districtBackgroundUrl,
  districtName = "",
}: AdminLocationFormProps) {
  const [state, formAction] = useActionState<AdminFormState, FormData>(createLocation, {});
  const modal = useAdminModalControls();
  const toast = useAdminToast();

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error, toast]);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      modal?.close();
    }
  }, [state.success, toast, modal]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {fixedDistrictId ? (
        <input type="hidden" name="district_id" value={fixedDistrictId} />
      ) : (
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
      )}
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Location Name</span>
        <input name="name" type="text" required placeholder="Central Café" className={INPUT_CLASS} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Description</span>
        <textarea name="description" rows={2} placeholder="Optional" className={INPUT_CLASS} />
      </label>

      <MapPositionPicker backgroundUrl={districtBackgroundUrl} />

      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS}>Order</span>
        <input name="order_index" type="number" min={0} defaultValue={0} className={INPUT_CLASS} />
      </label>
      <LocationIconField name="icon_url" label="Map Icon" districtName={districtName} />
      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
        <span className="text-body-strong text-white">Published</span>
        <input name="is_published" type="checkbox" className="h-5 w-5 shrink-0 accent-lime-green" />
      </label>
      <div className="flex gap-2">
        <SubmitButton />
        {modal && (
          <SlayButton type="button" variant="ghost" size="md" onClick={() => modal.close()}>
            Cancel
          </SlayButton>
        )}
      </div>
    </form>
  );
}
