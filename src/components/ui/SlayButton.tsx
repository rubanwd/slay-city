"use client";

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

export type SlayButtonVariant = "pink" | "green" | "ghost";
export type SlayButtonSize = "sm" | "md" | "lg";

export interface SlayButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SlayButtonVariant;
  size?: SlayButtonSize;
  /** Shows a spinner and disables interaction */
  loading?: boolean;
  /** Icon placed before the label */
  iconLeft?: ReactNode;
  /** Icon placed after the label */
  iconRight?: ReactNode;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<SlayButtonVariant, string> = {
  pink: [
    "bg-neon-pink text-white",
    "hover:brightness-110 active:brightness-90",
    "focus-visible:ring-neon-pink",
  ].join(" "),
  green: [
    "bg-lime-green text-black",
    "hover:brightness-110 active:brightness-90",
    "focus-visible:ring-lime-green",
  ].join(" "),
  ghost: [
    "bg-transparent text-white border border-white/25",
    "hover:bg-white/10 active:bg-white/5",
    "focus-visible:ring-white",
  ].join(" "),
};

const SIZE_CLASSES: Record<SlayButtonSize, string> = {
  sm: "h-10 px-4 text-sm  rounded-xl gap-1.5",
  md: "h-13 px-6 text-base rounded-2xl gap-2",
  lg: "h-16 px-8 text-lg  rounded-2xl gap-2.5",
};

const Spinner = () => (
  <svg
    className="animate-spin shrink-0"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const SlayButton = forwardRef<HTMLButtonElement, SlayButtonProps>(function SlayButton(
  {
    variant = "pink",
    size = "md",
    loading = false,
    iconLeft,
    iconRight,
    disabled,
    children,
    className = "",
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      className={[
        // Base
        "inline-flex items-center justify-center font-extrabold tracking-wide uppercase",
        "select-none transition-all duration-150",
        // Focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        // Disabled state
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
        // Variant + size
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? <Spinner /> : iconLeft}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
});

export default SlayButton;
