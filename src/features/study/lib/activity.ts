import type { Attempt } from "../types/index.ts";
export function millisecondsBetween(
  start: string | undefined,
  end: string,
): number | null {
  return start && Number.isFinite(Date.parse(start))
    ? Math.max(0, Date.parse(end) - Date.parse(start))
    : null;
}
export function activateAttempt(
  attempt: Attempt,
  now: string,
  sessionId: string,
): Attempt {
  const timing = attempt.timing ?? { activeMs: 0, questions: {} };
  return {
    ...attempt,
    updatedAt: now,
    timing: {
      ...timing,
      activeSince:
        timing.activeSessionId === sessionId && timing.activeSince
          ? timing.activeSince
          : now,
      activeSessionId: sessionId,
      pausedAt: undefined,
    },
  };
}
export function pauseAttempt(
  attempt: Attempt,
  now: string,
  sessionId: string,
): Attempt {
  const timing = attempt.timing ?? { activeMs: 0, questions: {} };
  const elapsed =
    timing.activeSessionId === sessionId
      ? (millisecondsBetween(timing.activeSince, now) ?? 0)
      : 0;
  return {
    ...attempt,
    updatedAt: now,
    timing: {
      ...timing,
      activeMs: timing.activeMs + elapsed,
      activeSince: undefined,
      pausedAt: now,
    },
  };
}
