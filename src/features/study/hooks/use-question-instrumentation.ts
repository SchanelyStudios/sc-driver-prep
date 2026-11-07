"use client";
import { useEffect, useRef } from "react";
import { studyActions } from "../lib/repository";
import type { Attempt } from "../types";
export function useQuestionInstrumentation(attempt: Attempt) {
  const visit = useRef<{ key: string; id: string } | null>(null);
  const questionId = attempt.questions[attempt.cursor].id;
  useEffect(() => {
    const key = `${attempt.id}:${questionId}`;
    // The same ID survives Strict Mode's setup replay; genuine revisits get a new ID.
    if (visit.current?.key !== key)
      visit.current = { key, id: crypto.randomUUID() };
    const show = () =>
      studyActions.viewQuestion(attempt.id, questionId, visit.current!.id);
    if (!document.hidden) show();
    const visibility = () => {
      if (document.hidden) studyActions.pause(attempt.id, "visibility");
      else {
        visit.current = { key, id: crypto.randomUUID() };
        show();
      }
    };
    const pagehide = () => studyActions.pause(attempt.id, "pagehide");
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", pagehide);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pagehide);
    };
  }, [attempt.id, questionId]);
}
