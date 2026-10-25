"use client";
import { Button as HeadlessButton } from "@headlessui/react";
import type { ComponentPropsWithoutRef } from "react";
import { classes } from "@/lib/classes";
const styles = {
  base: "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-45",
  variants: {
    primary: "bg-brand text-surface hover:bg-brand-hover",
    secondary: "border border-line bg-surface text-ink hover:bg-canvas",
    quiet: "text-muted hover:bg-brand-soft hover:text-brand",
    danger: "bg-danger text-surface hover:opacity-90",
    accent: "bg-accent text-ink hover:bg-accent/85",
  },
  sizes: {
    none: "",
    md: "min-h-11 px-5 py-2.5",
    sm: "min-h-10 px-3 py-2",
    icon: "size-11 shrink-0",
  },
};
type Props = ComponentPropsWithoutRef<"button"> & {
  variant?: keyof typeof styles.variants;
  size?: keyof typeof styles.sizes;
};
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: Props) {
  return (
    <HeadlessButton
      type={type}
      className={classes(
        styles.base,
        styles.variants[variant],
        styles.sizes[size],
        className,
      )}
      {...props}
    />
  );
}
