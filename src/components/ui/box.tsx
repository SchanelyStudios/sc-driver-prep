import type { ComponentPropsWithoutRef } from "react";
import { classes } from "@/lib/classes";
const styles = {
  base: "flex min-w-0",
  direction: { row: "flex-row", column: "flex-col" },
  gap: {
    none: "gap-0",
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  },
  align: {
    stretch: "items-stretch",
    start: "items-start",
    center: "items-center",
    end: "items-end",
  },
  justify: {
    start: "justify-start",
    center: "justify-center",
    between: "justify-between",
    end: "justify-end",
  },
  wrap: "flex-wrap",
} as const;
type Props = ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "section" | "main" | "header" | "footer" | "nav" | "aside";
  direction?: keyof typeof styles.direction;
  gap?: keyof typeof styles.gap;
  align?: keyof typeof styles.align;
  justify?: keyof typeof styles.justify;
  wrap?: boolean;
};
export function Box({
  as: Tag = "div",
  direction = "column",
  gap = "md",
  align = "stretch",
  justify = "start",
  wrap,
  className,
  ...props
}: Props) {
  return (
    <Tag
      className={classes(
        styles.base,
        styles.direction[direction],
        styles.gap[gap],
        styles.align[align],
        styles.justify[justify],
        wrap && styles.wrap,
        className,
      )}
      {...props}
    />
  );
}
