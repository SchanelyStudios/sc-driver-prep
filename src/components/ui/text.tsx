import type { ComponentPropsWithoutRef } from "react";
import { classes } from "@/lib/classes";

const variants = {
  display: "text-4xl font-bold tracking-[-0.045em] leading-[1.12] sm:text-5xl",
  title: "text-3xl font-bold tracking-[-0.035em] leading-tight sm:text-4xl",
  question: "text-xl font-medium leading-8 sm:text-2xl",
  heading: "text-xl font-semibold tracking-tight leading-snug",
  subheading: "text-base font-semibold leading-6",
  body: "text-base leading-7",
  small: "text-sm leading-6",
  caption: "text-xs leading-5",
  eyebrow: "text-[11px] font-bold uppercase tracking-[0.16em] leading-5",
  metric: "text-4xl font-bold tracking-tight tabular-nums",
} as const;
const tones = {
  default: "text-ink",
  muted: "text-muted",
  inverse: "text-surface",
  brand: "text-brand",
  success: "text-success",
  danger: "text-danger",
  accent: "text-accent-ink",
};
type Tag = "p" | "span" | "h1" | "h2" | "h3" | "h4" | "div";
type TextProps = ComponentPropsWithoutRef<"p"> & {
  as?: Tag;
  variant?: keyof typeof variants;
  tone?: keyof typeof tones;
};
export function Text({
  as: Tag = "p",
  variant = "body",
  tone = "default",
  className,
  ...props
}: TextProps) {
  return (
    <Tag
      className={classes(variants[variant], tones[tone], className)}
      {...props}
    />
  );
}
