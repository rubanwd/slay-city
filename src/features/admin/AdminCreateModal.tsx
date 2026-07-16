"use client";

import { useState, type ReactNode } from "react";

import { SlayButton } from "@/components/ui";

import AdminModal from "./AdminModal";

export interface AdminCreateModalProps {
  /** Label on the trigger button, e.g. "Add Mission". */
  triggerLabel: string;
  /** Modal heading, e.g. "New Mission". */
  title: string;
  /** The create form — reads {@link useAdminModalControls} to close itself on success/cancel. */
  children: ReactNode;
  className?: string;
}

/** "Add X" button that opens {@link AdminModal} with a create form inside. */
export default function AdminCreateModal({
  triggerLabel,
  title,
  children,
  className,
}: AdminCreateModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SlayButton
        type="button"
        variant="green"
        size="md"
        className={className ?? "w-full"}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </SlayButton>
      <AdminModal open={open} onClose={() => setOpen(false)} title={title}>
        {children}
      </AdminModal>
    </>
  );
}
