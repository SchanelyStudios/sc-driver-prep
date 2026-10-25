"use client";
import {
  Disclosure as HeadlessDisclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import type { ReactNode } from "react";
import { Icon } from "./icon";
const styles = {
  root: "rounded-xl border border-line bg-surface",
  button:
    "flex w-full items-start justify-between gap-4 rounded-xl p-5 text-left text-sm leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
  panel: "px-5 pb-5",
  marker: "shrink-0 pt-1 text-muted",
};
export function Disclosure({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <HeadlessDisclosure as="div" className={styles.root}>
      <DisclosureButton className={styles.button}>
        {({ open }) => (
          <>
            {title}
            <span className={styles.marker}>
              {open ? "−" : <Icon name="arrow" size="sm" />}
            </span>
          </>
        )}
      </DisclosureButton>
      <DisclosurePanel className={styles.panel}>{children}</DisclosurePanel>
    </HeadlessDisclosure>
  );
}
