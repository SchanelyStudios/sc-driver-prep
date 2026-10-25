import type { ComponentPropsWithoutRef } from "react";
import { classes } from "@/lib/classes";
const styles = {
  link: "inline-flex w-fit items-center gap-2 rounded text-sm font-semibold text-brand underline decoration-line underline-offset-4 hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus",
};
export function ActionLink({
  className,
  ...props
}: ComponentPropsWithoutRef<"a">) {
  return <a className={classes(styles.link, className)} {...props} />;
}
