import type { Mode } from "../types/index.ts";
export type EventData = {
  question_viewed: { visitId: string };
  answer_selected: { answerId: string; sinceViewMs: number | null };
  answer_checked: {
    answerId: string;
    correct: boolean;
    sinceSelectionMs: number | null;
  };
  question_completed: {
    answerId: string | null;
    correct: boolean | null;
    completion: "practice-check" | "practice-teach" | "review-submit";
  };
  question_continued: {
    nextQuestionId: string | null;
    direction: "next" | "previous" | "jump" | "finish";
    sinceViewMs: number | null;
    sinceCheckMs: number | null;
  };
  practice_started: { questionCount: number };
  practice_finished: { elapsedMs: number; activeMs: number };
  review_started: { questionCount: number };
  review_completed: {
    correct: number;
    total: number;
    passed: boolean;
    elapsedMs: number;
    activeMs: number;
  };
  review_cancelled: { elapsedMs: number; activeMs: number };
  session_paused: {
    reason: "navigation" | "visibility" | "pagehide" | "profile-switch";
  };
  session_resumed: { questionCount: number };
  section_first_accessed: Record<string, never>;
  section_practice_completed: { first: boolean; questionCount: number };
  section_review_first_started: Record<string, never>;
  section_review_first_completed: { passed: boolean };
};
export type EventName = keyof EventData;
/** Explicit context intentionally excludes email, question text, and free-form URLs. */
export type EventContext = {
  profileId: string;
  attemptId?: string;
  sectionId?: string;
  mode?: Mode;
  questionId?: string;
  questionRevision?: number;
  bankVersion?: string;
  sourceVersion?: string;
};
export type StudyEvent = {
  [Name in EventName]: EventContext & {
    schemaVersion: 1;
    id: string;
    sessionId: string;
    occurredAt: string;
    name: Name;
    data: EventData[Name];
  };
}[EventName];
export type EventTransport = (events: readonly StudyEvent[]) => Promise<void>;
