"use client";
import type {
  Attempt,
  Profile,
  Question,
  SavedData,
  SectionMilestones,
  View,
} from "../types";
import {
  answerQuestion,
  checkPracticeAnswer,
  teachPracticeQuestion,
  completeAttempt,
  cancelAttempt,
  score,
} from "./engine";
import { studyAnalytics } from "../analytics/client";
import type { EventContext } from "../analytics/types";
import { activateAttempt, pauseAttempt, millisecondsBetween } from "./activity";
import { parseSavedData } from "./validation";

export const STORAGE_KEY = "sc-driver-prep:v1";
const empty = (): SavedData => ({
  version: 1,
  activeProfileId: null,
  profiles: [],
});
type Snapshot = {
  ready: boolean;
  data: SavedData;
  error: string | null;
  protected: boolean;
};
const serverSnapshot: Snapshot = {
  ready: false,
  data: empty(),
  error: null,
  protected: false,
};
let snapshot = serverSnapshot;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    snapshot = {
      ready: true,
      data: raw ? parseSavedData(raw) : empty(),
      error: null,
      protected: false,
    };
  } catch {
    snapshot = {
      ready: true,
      data: empty(),
      error:
        "Saved progress could not be read. Existing data has been left intact. You can study this session, but changes will not be saved. Reset local data only if you want to start over.",
      protected: true,
    };
  }
  emit();
}
export const progressRepository = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!snapshot.ready) load();
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) load();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => serverSnapshot,
};
function update(transform: (data: SavedData) => SavedData) {
  let latest = snapshot.data;
  if (!snapshot.protected && !snapshot.error) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) latest = parseSavedData(raw);
    } catch {
      snapshot = {
        ...snapshot,
        protected: true,
        error:
          "Saved data changed or became unavailable. Your existing data is protected; this session will not be saved.",
      };
    }
  }
  const data = transform(latest);
  let error = snapshot.error;
  if (!snapshot.protected) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      error = null;
    } catch {
      error =
        "Your latest changes could not be saved in this browser. Keep this tab open; storage may be full or unavailable.";
    }
  }
  snapshot = { ...snapshot, ready: true, data, error };
  emit();
}
function updateProfile(transform: (profile: Profile) => Profile) {
  update((data) => ({
    ...data,
    profiles: data.profiles.map((p) =>
      p.id === data.activeProfileId ? transform(p) : p,
    ),
  }));
}
function context(
  profile: Profile,
  attempt?: Attempt,
  question?: Question,
): EventContext {
  return {
    profileId: profile.id,
    attemptId: attempt?.id,
    sectionId: question?.sectionId ?? attempt?.sectionId ?? undefined,
    mode: attempt?.mode,
    bankVersion: attempt?.bankVersion,
    sourceVersion: attempt?.sourceVersion,
    questionId: question?.id,
    questionRevision: question?.revision,
  };
}
function withAttempt(profile: Profile, attempt: Attempt): Profile {
  return {
    ...profile,
    attempts: profile.attempts.map((a) => (a.id === attempt.id ? attempt : a)),
  };
}
function mutateAttempt(
  id: string,
  transform: (profile: Profile, attempt: Attempt, now: string) => Profile,
) {
  updateProfile((p) => {
    const attempt = p.attempts.find((a) => a.id === id);
    return attempt ? transform(p, attempt, new Date().toISOString()) : p;
  });
}
function accessSection(
  profile: Profile,
  sectionId: string,
  now: string,
): Profile {
  const prior = profile.sectionMilestones?.[sectionId] ?? {};
  if (!prior.firstAccessedAt)
    studyAnalytics.record(
      "section_first_accessed",
      { profileId: profile.id, sectionId },
      {},
      now,
    );
  return {
    ...profile,
    lastSectionId: sectionId === "S12" ? profile.lastSectionId : sectionId,
    sectionMilestones: {
      ...profile.sectionMilestones,
      [sectionId]: {
        ...prior,
        firstAccessedAt: prior.firstAccessedAt ?? now,
        lastAccessedAt: now,
      },
    },
  };
}
function milestone(
  profile: Profile,
  sectionId: string,
  key: keyof SectionMilestones,
  now: string,
): Profile {
  const prior = profile.sectionMilestones?.[sectionId] ?? {};
  return {
    ...profile,
    sectionMilestones: {
      ...profile.sectionMilestones,
      [sectionId]: { ...prior, [key]: prior[key] ?? now },
    },
  };
}
function pause(
  profile: Profile,
  attempt: Attempt,
  reason: "navigation" | "visibility" | "pagehide" | "profile-switch",
  now: string,
): Attempt {
  if (attempt.status !== "in-progress" || !attempt.timing?.activeSince)
    return attempt;
  studyAnalytics.record(
    "session_paused",
    context(profile, attempt),
    { reason },
    now,
  );
  return pauseAttempt(attempt, now, studyAnalytics.getSessionId());
}
function continueQuestion(
  profile: Profile,
  attempt: Attempt,
  direction: "next" | "previous" | "jump" | "finish",
  nextQuestionId: string | null,
  now: string,
) {
  const q = attempt.questions[attempt.cursor];
  const timing = attempt.timing?.questions[q.id];
  studyAnalytics.record(
    "question_continued",
    context(profile, attempt, q),
    {
      nextQuestionId,
      direction,
      sinceViewMs: millisecondsBetween(timing?.lastViewedAt, now),
      sinceCheckMs: millisecondsBetween(timing?.checkedAt, now),
    },
    now,
  );
}
export const studyActions = {
  signIn(email: string) {
    const normalized = email.trim().toLowerCase();
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ||
      normalized.length > 254
    )
      return false;
    update((data) => {
      const existing = data.profiles.find((p) => p.email === normalized);
      const profile: Profile = existing ?? {
        id: crypto.randomUUID(),
        email: normalized,
        createdAt: new Date().toISOString(),
        attempts: [],
        view: { screen: "dashboard" },
      };
      return {
        ...data,
        activeProfileId: profile.id,
        profiles: existing ? data.profiles : [...data.profiles, profile],
      };
    });
    return true;
  },
  signOut() {
    updateProfile((p) => {
      const a =
        p.view.screen === "attempt"
          ? p.attempts.find(
              (a) =>
                a.id ===
                (p.view.screen === "attempt" ? p.view.attemptId : null),
            )
          : undefined;
      return a
        ? withAttempt(
            p,
            pause(p, a, "profile-switch", new Date().toISOString()),
          )
        : p;
    });
    update((data) => ({ ...data, activeProfileId: null }));
  },
  navigate(view: View) {
    updateProfile((p) => {
      const now = new Date().toISOString();
      const currentId = p.view.screen === "attempt" ? p.view.attemptId : null;
      const current = p.attempts.find((a) => a.id === currentId);
      let next =
        current && (view.screen !== "attempt" || view.attemptId !== currentId)
          ? withAttempt(p, pause(p, current, "navigation", now))
          : p;
      if (view.screen === "section")
        next = accessSection(next, view.sectionId, now);
      return { ...next, view };
    });
  },
  visitSection(sectionId: string) {
    updateProfile((p) => accessSection(p, sectionId, new Date().toISOString()));
  },
  start(attempt: Attempt) {
    updateProfile((profile) => {
      // Starting the same mode twice cannot create two simultaneous reviews.
      const existing = profile.attempts.find(
        (a) =>
          a.mode === attempt.mode &&
          a.sectionId === attempt.sectionId &&
          a.status === "in-progress",
      );
      if (existing)
        return {
          ...profile,
          view: { screen: "attempt", attemptId: existing.id },
        };
      let p = attempt.sectionId
        ? accessSection(profile, attempt.sectionId, attempt.startedAt)
        : profile;
      if (attempt.mode === "practice")
        studyAnalytics.record(
          "practice_started",
          context(p, attempt),
          { questionCount: attempt.questions.length },
          attempt.startedAt,
        );
      else
        studyAnalytics.record(
          "review_started",
          context(p, attempt),
          { questionCount: attempt.questions.length },
          attempt.startedAt,
        );
      if (attempt.mode === "review" && attempt.sectionId) {
        if (!p.sectionMilestones?.[attempt.sectionId]?.reviewStartedAt)
          studyAnalytics.record(
            "section_review_first_started",
            context(p, attempt),
            {},
            attempt.startedAt,
          );
        p = milestone(
          p,
          attempt.sectionId,
          "reviewStartedAt",
          attempt.startedAt,
        );
      }
      return {
        ...p,
        attempts: [...p.attempts, attempt],
        view: { screen: "attempt", attemptId: attempt.id },
      };
    });
  },
  viewQuestion(id: string, questionId: string, visitId: string) {
    mutateAttempt(id, (p, a, now) => {
      if (
        a.status !== "in-progress" ||
        a.questions[a.cursor].id !== questionId ||
        a.timing?.questions[questionId]?.lastVisitId === visitId
      )
        return p;
      const resumed =
        !!a.timing?.pausedAt ||
        (!!a.timing &&
          a.timing.activeSessionId !== studyAnalytics.getSessionId());
      const active = activateAttempt(a, now, studyAnalytics.getSessionId());
      const prior = active.timing!.questions[questionId];
      const next = {
        ...active,
        timing: {
          ...active.timing!,
          questions: {
            ...active.timing!.questions,
            [questionId]: {
              ...prior,
              firstViewedAt: prior?.firstViewedAt ?? now,
              lastViewedAt: now,
              lastVisitId: visitId,
            },
          },
        },
      };
      if (resumed)
        studyAnalytics.record(
          "session_resumed",
          context(p, a),
          { questionCount: a.questions.length },
          now,
        );
      studyAnalytics.record(
        "question_viewed",
        context(p, a, a.questions[a.cursor]),
        { visitId },
        now,
      );
      return withAttempt(p, next);
    });
  },
  pause(id: string, reason: "visibility" | "pagehide") {
    mutateAttempt(id, (p, a, now) => withAttempt(p, pause(p, a, reason, now)));
  },
  answer(id: string, questionId: string, choiceId: string) {
    mutateAttempt(id, (p, a, now) => {
      const next = answerQuestion(a, questionId, choiceId);
      if (next === a || a.answers[questionId] === choiceId) return p;
      const q = a.questions.find((q) => q.id === questionId)!;
      const prior = a.timing?.questions[questionId];
      studyAnalytics.record(
        "answer_selected",
        context(p, a, q),
        {
          answerId: choiceId,
          sinceViewMs: millisecondsBetween(prior?.lastViewedAt, now),
        },
        now,
      );
      if (prior)
        next.timing = {
          ...a.timing!,
          questions: {
            ...a.timing!.questions,
            [questionId]: { ...prior, lastSelectedAt: now },
          },
        };
      return withAttempt(p, { ...next, updatedAt: now });
    });
  },
  teach(id: string) {
    studyActions.check(id, true);
  },
  check(id: string, teach = false) {
    mutateAttempt(id, (profile, a, now) => {
      let p = profile;
      const next = teach ? teachPracticeQuestion(a) : checkPracticeAnswer(a);
      if (next === a) return p;
      const q = a.questions[a.cursor];
      const answerId = a.answers[q.id];
      const prior = a.timing?.questions[q.id];
      if (!teach)
        studyAnalytics.record(
          "answer_checked",
          context(p, a, q),
          {
            answerId,
            correct: answerId === q.correctChoiceId,
            sinceSelectionMs: millisecondsBetween(prior?.lastSelectedAt, now),
          },
          now,
        );
      studyAnalytics.record(
        "question_completed",
        context(p, a, q),
        {
          answerId: teach ? null : answerId,
          correct: teach ? null : answerId === q.correctChoiceId,
          completion: teach ? "practice-teach" : "practice-check",
        },
        now,
      );
      if (prior)
        next.timing = {
          ...a.timing!,
          questions: {
            ...a.timing!.questions,
            [q.id]: { ...prior, checkedAt: now },
          },
        };
      if (next.checked.length === next.questions.length && a.sectionId) {
        const first = !p.sectionMilestones?.[a.sectionId]?.practiceCompletedAt;
        studyAnalytics.record(
          "section_practice_completed",
          context(p, a),
          { first, questionCount: a.questions.length },
          now,
        );
        p = milestone(p, a.sectionId, "practiceCompletedAt", now);
      }
      return withAttempt(p, { ...next, updatedAt: now });
    });
  },
  cursor(
    id: string,
    cursor: number,
    direction: "next" | "previous" | "jump" = "jump",
  ) {
    mutateAttempt(id, (p, a, now) => {
      if (a.status !== "in-progress") return p;
      const nextCursor = Math.max(0, Math.min(cursor, a.questions.length - 1));
      if (nextCursor === a.cursor) return p;
      continueQuestion(p, a, direction, a.questions[nextCursor].id, now);
      const prior = a.timing?.questions[a.questions[a.cursor].id];
      const next = { ...a, cursor: nextCursor, updatedAt: now };
      if (prior)
        next.timing = {
          ...a.timing!,
          questions: {
            ...a.timing!.questions,
            [a.questions[a.cursor].id]: { ...prior, lastContinuedAt: now },
          },
        };
      return withAttempt(p, next);
    });
  },
  complete(id: string) {
    mutateAttempt(id, (profile, a, now) => {
      if (a.status !== "in-progress") return profile;
      let p = profile;
      const completed = completeAttempt(a, now);
      const next = pauseAttempt(
        { ...completed, updatedAt: now },
        now,
        studyAnalytics.getSessionId(),
      );
      continueQuestion(p, a, "finish", null, now);
      const elapsedMs = millisecondsBetween(a.startedAt, now) ?? 0;
      const activeMs = next.timing!.activeMs;
      if (a.mode === "practice")
        studyAnalytics.record(
          "practice_finished",
          context(p, a),
          { elapsedMs, activeMs },
          now,
        );
      else {
        const result = score(a);
        studyAnalytics.record(
          "review_completed",
          context(p, a),
          {
            correct: result.correct,
            total: result.total,
            passed: result.passed,
            elapsedMs,
            activeMs,
          },
          now,
        );
        for (const q of a.questions)
          studyAnalytics.record(
            "question_completed",
            context(p, a, q),
            {
              answerId: a.answers[q.id] ?? null,
              correct: a.answers[q.id] === q.correctChoiceId,
              completion: "review-submit",
            },
            now,
          );
        if (a.mode === "review" && a.sectionId) {
          if (!p.sectionMilestones?.[a.sectionId]?.reviewCompletedAt)
            studyAnalytics.record(
              "section_review_first_completed",
              context(p, a),
              { passed: result.passed },
              now,
            );
          p = milestone(p, a.sectionId, "reviewCompletedAt", now);
        }
      }
      return withAttempt(p, next);
    });
  },
  cancel(id: string) {
    mutateAttempt(id, (p, a, now) => {
      if (a.status !== "in-progress" || a.mode !== "comprehensive") return p;
      const next = pauseAttempt(
        cancelAttempt(a, now),
        now,
        studyAnalytics.getSessionId(),
      );
      studyAnalytics.record(
        "review_cancelled",
        context(p, a),
        {
          elapsedMs: millisecondsBetween(a.startedAt, now) ?? 0,
          activeMs: next.timing!.activeMs,
        },
        now,
      );
      return { ...withAttempt(p, next), view: { screen: "dashboard" } };
    });
  },
  clearProfile() {
    updateProfile((p) => {
      studyAnalytics.clearProfile(p.id);
      return {
        ...p,
        attempts: [],
        sectionMilestones: {},
        lastSectionId: undefined,
        view: { screen: "dashboard" },
      };
    });
  },
  resetLocalData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      studyAnalytics.clearAll();
      snapshot = { ready: true, data: empty(), error: null, protected: false };
      emit();
    } catch {
      snapshot = {
        ...snapshot,
        error:
          "This browser is still preventing storage access. Please allow site storage in browser settings.",
      };
      emit();
    }
  },
};
