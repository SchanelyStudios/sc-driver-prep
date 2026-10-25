"use client";
import type { Attempt, Profile, SavedData, View } from "../types";
import { answerQuestion, checkPracticeAnswer, completeAttempt } from "./engine";
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
function updateAttempt(id: string, transform: (attempt: Attempt) => Attempt) {
  updateProfile((p) => ({
    ...p,
    attempts: p.attempts.map((a) => (a.id === id ? transform(a) : a)),
  }));
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
    update((data) => ({ ...data, activeProfileId: null }));
  },
  navigate(view: View) {
    updateProfile((p) => ({ ...p, view }));
  },
  start(attempt: Attempt) {
    updateProfile((p) => ({
      ...p,
      attempts: [...p.attempts, attempt],
      view: { screen: "attempt", attemptId: attempt.id },
    }));
  },
  answer(id: string, questionId: string, choiceId: string) {
    updateAttempt(id, (a) => answerQuestion(a, questionId, choiceId));
  },
  check(id: string) {
    updateAttempt(id, checkPracticeAnswer);
  },
  cursor(id: string, cursor: number) {
    updateAttempt(id, (a) => ({
      ...a,
      cursor: Math.max(0, Math.min(cursor, a.questions.length - 1)),
    }));
  },
  complete(id: string) {
    updateAttempt(id, completeAttempt);
  },
  clearProfile() {
    updateProfile((p) => ({
      ...p,
      attempts: [],
      view: { screen: "dashboard" },
    }));
  },
  resetLocalData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
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
