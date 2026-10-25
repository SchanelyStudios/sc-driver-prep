"use client";
import { useSyncExternalStore } from "react";
import { progressRepository } from "../lib/repository";
export function useStudy() {
  const state = useSyncExternalStore(
    progressRepository.subscribe,
    progressRepository.getSnapshot,
    progressRepository.getServerSnapshot,
  );
  return {
    ...state,
    profile:
      state.data.profiles.find((p) => p.id === state.data.activeProfileId) ??
      null,
  };
}
