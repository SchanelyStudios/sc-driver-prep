"use client";
import { Description, Field, Input, Label } from "@headlessui/react";
const styles = {
  field: "flex flex-col gap-2",
  label: "text-sm font-semibold text-ink",
  input:
    "min-h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-subtle focus:border-focus focus:outline-2 focus:outline-focus",
  help: "text-xs leading-5 text-muted",
};
export function EmailField() {
  return (
    <Field className={styles.field}>
      <Label className={styles.label}>Email address</Label>
      <Input
        className={styles.input}
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        maxLength={254}
        required
      />
      <Description className={styles.help}>
        Used to find your progress on this browser. No password needed.
      </Description>
    </Field>
  );
}
