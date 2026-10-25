import type { ComponentProps } from "react";
import { Box } from "./box";
import { classes } from "@/lib/classes";
const styles = {
  base: "rounded-card border p-6 shadow-card sm:p-7",
  tone: {
    default: "border-line bg-surface",
    brand: "border-brand bg-brand",
    soft: "border-brand-soft bg-brand-soft",
    accent: "border-accent-soft bg-accent-soft",
  },
};
export function Card({
  tone = "default",
  className,
  ...props
}: ComponentProps<typeof Box> & { tone?: keyof typeof styles.tone }) {
  return (
    <Box
      className={classes(styles.base, styles.tone[tone], className)}
      {...props}
    />
  );
}
