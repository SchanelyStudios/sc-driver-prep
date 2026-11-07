"use client";
import { useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Sidebar } from "./sidebar";
import { Dashboard } from "./dashboard";
import { Welcome } from "./welcome";
import { SectionOverview } from "./section-overview";
import { QuizSession } from "./quiz-session";
import { Results } from "./results";
import { useStudy } from "../hooks/use-study";
import { createAttempt, sections } from "../data";
import { studyActions } from "../lib/repository";
import type { Mode } from "../types";
const styles = {
  shell: "min-h-dvh lg:flex",
  mainColumn: "min-w-0 flex-1",
  main: "mx-auto min-h-[80vh] w-full max-w-6xl px-5 pb-12 pt-7 sm:px-9 sm:pt-10 xl:px-12",
  footer:
    "mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-6 sm:px-9 xl:px-12",
  loading: "flex min-h-dvh items-center justify-center text-muted",
  alert:
    "border-b border-danger/20 bg-danger-soft px-5 py-4 text-sm text-danger",
  modalBody: "pt-4",
};
export function StudyApp() {
  const {
    ready,
    profile,
    error: storageError,
    protected: protectedStorage,
  } = useStudy();
  const [error, setError] = useState<string | null>(null);
  const [reset, setReset] = useState(false);
  const [startReviewOpen, setStartReviewOpen] = useState(false);
  const view = profile?.view;
  const attempt =
    view?.screen === "attempt"
      ? profile?.attempts.find((a) => a.id === view.attemptId)
      : undefined;
  const focusKey = `${profile?.id}:${JSON.stringify(view)}:${attempt?.status}`;
  useEffect(() => {
    document.querySelector<HTMLElement>("[data-page-heading]")?.focus();
  }, [focusKey]);
  const sectionId = view?.screen === "section" ? view.sectionId : null;
  useEffect(() => {
    if (profile?.id && sectionId) studyActions.visitSection(sectionId);
  }, [profile?.id, sectionId]);
  function begin(mode: Mode, sectionId: string | null) {
    if (!profile) return;
    setError(null);
    const pending = profile.attempts.find(
      (a) =>
        a.mode === mode &&
        a.sectionId === sectionId &&
        a.status === "in-progress",
    );
    if (pending) {
      studyActions.navigate({ screen: "attempt", attemptId: pending.id });
      return;
    }
    try {
      studyActions.start(createAttempt(mode, sectionId));
    } catch {
      setError(
        "This session could not be prepared. Your progress is safe; please try another section.",
      );
    }
  }
  function start(mode: Mode, sectionId: string | null) {
    const pending = profile?.attempts.find(
      (a) =>
        a.mode === mode &&
        a.sectionId === sectionId &&
        a.status === "in-progress",
    );
    if (pending) {
      studyActions.navigate({ screen: "attempt", attemptId: pending.id });
      return;
    }
    if (mode === "comprehensive") setStartReviewOpen(true);
    else begin(mode, sectionId);
  }
  if (!ready)
    return (
      <main id="main-content" className={styles.loading}>
        <Text variant="small" role="status">
          Getting your study space ready…
        </Text>
      </main>
    );
  const issue = storageError ?? error;
  const alerts = issue && (
    <Box
      direction="row"
      wrap
      align="center"
      justify="between"
      className={styles.alert}
      role="alert"
    >
      <Text variant="small" tone="danger">
        {issue}
      </Text>
      {protectedStorage && (
        <Button variant="danger" size="sm" onClick={() => setReset(true)}>
          Reset unreadable local data
        </Button>
      )}
    </Box>
  );
  const confirm = (
    <Dialog
      open={reset}
      onClose={() => setReset(false)}
      title={
        protectedStorage
          ? "Reset this browser’s study data?"
          : "Clear this profile’s progress?"
      }
    >
      <Box className={styles.modalBody}>
        <Text variant="small" tone="muted">
          {protectedStorage
            ? "This removes this app’s saved profiles and study progress from this browser. It cannot be undone."
            : "This removes all practice and review history for this profile, including the first comprehensive score. Other profiles stay unchanged. It cannot be undone."}
        </Text>
        <Box direction="row" wrap justify="end">
          <Button variant="secondary" onClick={() => setReset(false)}>
            Keep my progress
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (protectedStorage) studyActions.resetLocalData();
              else studyActions.clearProfile();
              setReset(false);
            }}
          >
            Clear saved data
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
  if (!profile)
    return (
      <>
        {alerts}
        <Welcome />
        {confirm}
      </>
    );
  const section =
    view?.screen === "section"
      ? sections.find((s) => s.id === view.sectionId)
      : undefined;
  return (
    <>
      {alerts}
      <div className={styles.shell}>
        <Sidebar profile={profile} />
        <div className={styles.mainColumn}>
          <main className={styles.main} id="main-content">
            {attempt && attempt.status !== "cancelled" ? (
              attempt.status === "completed" ? (
                <Results
                  key={attempt.id}
                  attempt={attempt}
                  profile={profile}
                  onStart={start}
                />
              ) : (
                <QuizSession key={attempt.id} attempt={attempt} />
              )
            ) : section ? (
              <SectionOverview
                key={section.id}
                section={section}
                profile={profile}
                onStart={start}
              />
            ) : (
              <Dashboard profile={profile} onStart={start} />
            )}
          </main>
          <footer className={styles.footer}>
            <Text variant="caption" tone="muted">
              Prototype · Progress stays on this browser · Independent SCDMV
              manual practice
            </Text>
            <Box direction="row" gap="sm" wrap>
              <Button variant="quiet" size="sm" onClick={() => setReset(true)}>
                Clear progress
              </Button>
            </Box>
          </footer>
        </div>
      </div>
      <Dialog
        open={startReviewOpen}
        onClose={() => setStartReviewOpen(false)}
        title="Start a new comprehensive review?"
      >
        <Box className={styles.modalBody}>
          <Text variant="small" tone="muted">
            You’ll get 40 questions from across the manual. There’s no time
            limit, and you can leave and resume whenever you need. Your previous
            completed scores will stay saved.
          </Text>
          <Box direction="row" wrap justify="end">
            <Button
              variant="secondary"
              onClick={() => setStartReviewOpen(false)}
            >
              Not now
            </Button>
            <Button
              onClick={() => {
                setStartReviewOpen(false);
                begin("comprehensive", null);
              }}
            >
              Start comprehensive review
            </Button>
          </Box>
        </Box>
      </Dialog>
      {confirm}
    </>
  );
}
