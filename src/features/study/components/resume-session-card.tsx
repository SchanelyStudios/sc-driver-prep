"use client";
import { useState } from "react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { instructionalSections } from "../data";
import { studyActions } from "../lib/repository";
import type { Attempt } from "../types";
const styles = { card: "border-accent/40", modalBody: "pt-4" };
export function ResumeSessionCard({ attempt }: { attempt: Attempt }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const label =
    attempt.mode === "comprehensive"
      ? "Comprehensive review"
      : `${attempt.mode === "practice" ? "Guided practice" : "Section review"} · ${instructionalSections.find((s) => s.id === attempt.sectionId)?.title}`;
  return (
    <>
      <Card className={styles.card}>
        <Box direction="row" wrap align="center" justify="between">
          <Box gap="xs">
            <Text variant="subheading">You have a session in progress</Text>
            <Text variant="small" tone="muted">
              {label} · Question {attempt.cursor + 1} of{" "}
              {attempt.questions.length}
            </Text>
          </Box>
          <Box direction="row" wrap align="center">
            <Button
              onClick={() =>
                studyActions.navigate({
                  screen: "attempt",
                  attemptId: attempt.id,
                })
              }
            >
              Resume session
              <Icon name="arrow" size="sm" />
            </Button>
            {attempt.mode === "comprehensive" && (
              <Button variant="quiet" onClick={() => setCancelOpen(true)}>
                Cancel review
              </Button>
            )}
          </Box>
        </Box>
      </Card>
      <Dialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this comprehensive review?"
      >
        <Box className={styles.modalBody}>
          <Text variant="small" tone="muted">
            This ends the unfinished review. It won&apos;t count toward your
            scores or your first completed review. You can start a fresh one
            whenever you&apos;re ready.
          </Text>
          <Box direction="row" wrap justify="end">
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Keep review
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                studyActions.cancel(attempt.id);
                setCancelOpen(false);
              }}
            >
              Cancel review
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
