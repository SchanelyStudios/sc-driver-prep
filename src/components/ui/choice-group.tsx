"use client";
import { Field, Label, Radio, RadioGroup } from "@headlessui/react";
import { classes } from "@/lib/classes";
const styles = {
  group: "flex flex-col gap-3",
  choice:
    "group flex min-h-16 items-center gap-4 rounded-xl border border-line bg-surface px-4 py-4 transition-colors data-checked:border-brand data-checked:bg-brand-soft data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-focus data-disabled:cursor-default sm:px-5",
  letter:
    "flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-xs font-semibold text-muted group-data-checked:border-brand group-data-checked:bg-brand group-data-checked:text-surface",
  label: "flex-1 text-sm leading-6 text-ink",
  dot: "size-4 shrink-0 rounded-full border border-line group-data-checked:border-5 group-data-checked:border-brand",
  locked: "opacity-85",
};
export function ChoiceGroup({
  options,
  value,
  onChange,
  disabled,
  labelledBy,
}: {
  options: { id: string; text: string }[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  labelledBy: string;
}) {
  return (
    <RadioGroup
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      aria-labelledby={labelledBy}
      className={styles.group}
    >
      {options.map((option, index) => (
        <Field key={option.id}>
          <Radio
            value={option.id}
            className={classes(styles.choice, disabled && styles.locked)}
          >
            <span className={styles.letter} aria-hidden="true">
              {"ABCD"[index]}
            </span>
            <Label className={styles.label}>{option.text}</Label>
            <span className={styles.dot} aria-hidden="true" />
          </Radio>
        </Field>
      ))}
    </RadioGroup>
  );
}
