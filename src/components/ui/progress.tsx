const styles = {
  bar: "h-2 w-full appearance-none overflow-hidden rounded-full border-0 bg-line [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-line [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-brand [&::-moz-progress-bar]:bg-brand",
};
export function Progress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  return (
    <progress
      aria-label={label}
      value={value}
      max={max || 1}
      className={styles.bar}
    >
      {value} / {max}
    </progress>
  );
}
