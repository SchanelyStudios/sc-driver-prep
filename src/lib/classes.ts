import { twMerge } from "tailwind-merge";
/** Resolve overrides centrally so component variants compose predictably. */
export function classes(...values: (string | false | null | undefined)[]) {
  return twMerge(values.filter(Boolean).join(" "));
}
