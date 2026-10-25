import type { ComponentPropsWithoutRef } from "react";
const paths = {
  book: "M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4V4Zm9 3a3 3 0 0 1 3-3h4v14h-3a4 4 0 0 0-4 3",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  back: "M19 12H5m6-6-6 6 6 6",
  check: "m5 12 4 4L19 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "m6 6 12 12M18 6 6 18",
  grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  flag: "M5 21V4c5-4 9 4 14 0v10c-5 4-9-4-14 0",
  road: "m5 21 3-18m11 18L16 3M12 4v3m0 4v3m0 4v3",
  clock: "M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  user: "M5 21v-2a7 7 0 0 1 14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  external: "M14 3h7v7m0-7L10 14m0-9H4v15h15v-6",
  spark: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z",
  alert: "m12 3 10 18H2L12 3Zm0 6v5m0 3v.5",
} as const;
const styles = {
  sm: "size-4 shrink-0",
  md: "size-5 shrink-0",
  lg: "size-7 shrink-0",
};
export function Icon({
  name,
  size = "md",
  ...props
}: Omit<ComponentPropsWithoutRef<"svg">, "name"> & {
  name: keyof typeof paths;
  size?: keyof typeof styles;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={styles[size]}
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
