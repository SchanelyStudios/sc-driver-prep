import type { ReactNode } from "react";
import { classes } from "@/lib/classes";
const styles = {
  base: "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-4",
  tone: {
    neutral: "bg-canvas text-muted",
    brand: "bg-brand-soft text-brand",
    success: "bg-success-soft text-success",
    danger: "bg-danger-soft text-danger",
    accent: "bg-accent-soft text-accent-ink",
  },
};
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof styles.tone;
}) {
  return (
    <span className={classes(styles.base, styles.tone[tone])}>{children}</span>
  );
}
