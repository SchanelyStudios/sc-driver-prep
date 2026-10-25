"use client";
import {
  Dialog as HeadlessDialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import type { ReactNode } from "react";
import { classes } from "@/lib/classes";
const styles = {
  root: "fixed inset-0 z-50",
  backdrop:
    "fixed inset-0 bg-ink/40 transition duration-200 data-closed:opacity-0",
  positioning: {
    modal: "fixed inset-0 flex items-center justify-center overflow-y-auto p-4",
    drawer: "fixed inset-0 flex justify-start",
  },
  panel: {
    modal:
      "my-auto w-full max-w-md rounded-card bg-surface p-7 shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0",
    drawer:
      "relative h-dvh w-80 max-w-[90vw] overflow-hidden bg-surface shadow-xl transition duration-200 data-closed:-translate-x-full",
  },
  title: "text-xl font-semibold tracking-tight",
  hiddenTitle: "sr-only",
};
export function Dialog({
  open,
  onClose,
  title,
  children,
  kind = "modal",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  kind?: "modal" | "drawer";
}) {
  return (
    <HeadlessDialog open={open} onClose={onClose} className={styles.root}>
      <DialogBackdrop transition className={styles.backdrop} />
      <div className={styles.positioning[kind]}>
        <DialogPanel transition className={styles.panel[kind]}>
          <DialogTitle
            className={classes(
              styles.title,
              kind === "drawer" && styles.hiddenTitle,
            )}
          >
            {title}
          </DialogTitle>
          {children}
        </DialogPanel>
      </div>
    </HeadlessDialog>
  );
}
