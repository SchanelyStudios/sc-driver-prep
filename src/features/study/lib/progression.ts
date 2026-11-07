import type { Profile, Section } from "../types/index.ts";
import { comprehensiveHistory, sectionStatus } from "./engine.ts";
/** A passed section advances; an unfinished section stays the suggested next step. */
export function nextStudySection(
  profile: Profile,
  sections: Section[],
): Section | null {
  if (!comprehensiveHistory(profile.attempts).baseline) return null;
  const ordered = sections
    .filter((s) => s.type === "instructional")
    .sort((a, b) => a.number - b.number);
  const lastAttempt = profile.attempts
    .filter((a) => a.sectionId && a.status !== "cancelled")
    .sort((a, b) =>
      (a.updatedAt ?? a.completedAt ?? a.startedAt).localeCompare(
        b.updatedAt ?? b.completedAt ?? b.startedAt,
      ),
    )
    .at(-1);
  const lastId = profile.lastSectionId ?? lastAttempt?.sectionId;
  const last = ordered.find((s) => s.id === lastId);
  if (last && sectionStatus(profile.attempts, last.id) !== "Passed")
    return last;
  const next =
    last &&
    ordered.find(
      (s) =>
        s.number > last.number &&
        sectionStatus(profile.attempts, s.id) !== "Passed",
    );
  return (
    next ||
    ordered.find((s) => sectionStatus(profile.attempts, s.id) !== "Passed") ||
    null
  );
}
