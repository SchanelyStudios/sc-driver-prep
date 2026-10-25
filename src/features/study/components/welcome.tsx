"use client";
import { useState, type FormEvent } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmailField } from "@/components/ui/email-field";
import { Badge } from "@/components/ui/badge";
import { ActionLink } from "@/components/ui/action-link";
import { manualUrl } from "../data";
import { studyActions } from "../lib/repository";
const styles = {
  root: "mx-auto flex min-h-dvh max-w-6xl flex-col justify-center gap-10 px-6 py-10 sm:px-10",
  logo: "text-brand",
  grid: "grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20",
  headline: "max-w-lg",
  description: "max-w-md",
  features: "gap-5 pt-3",
  feature: "flex items-center gap-3 text-sm text-muted",
  featureIcon:
    "flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand",
  form: "flex flex-col gap-5",
  formCard: "gap-6 p-7 sm:p-10",
  privacy: "border-t border-line pt-5",
  footer: "pt-4",
  error: "text-danger",
};
export function Welcome() {
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    if (!studyActions.signIn(email))
      setError("Enter a valid email address to continue.");
  }
  return (
    <main id="main-content" className={styles.root}>
      <Box direction="row" align="center" gap="sm" className={styles.logo}>
        <Icon name="road" size="lg" />
        <Text variant="heading">SC Driver Prep</Text>
      </Box>
      <div className={styles.grid}>
        <Box gap="lg">
          <Badge tone="accent">South Carolina · Learner&apos;s permit</Badge>
          <Text
            as="h1"
            variant="display"
            className={styles.headline}
            data-page-heading
            tabIndex={-1}
          >
            A little practice.
            <br />A lot more confidence.
          </Text>
          <Text tone="muted" className={styles.description}>
            Learn the South Carolina driver&apos;s manual one section at a time.
            Understand the why behind each answer, then see what you know.
          </Text>
          <Box className={styles.features}>
            {[
              ["book", "Learn with short, friendly explanations."],
              ["flag", "Earn a section pass at 85% or higher."],
              ["spark", "See how far you’ve come with a pretest and reviews."],
            ].map(([icon, label]) => (
              <div key={label} className={styles.feature}>
                <span className={styles.featureIcon}>
                  <Icon name={icon as "book" | "flag" | "spark"} size="sm" />
                </span>
                <Text variant="small" tone="muted">
                  {label}
                </Text>
              </div>
            ))}
          </Box>
        </Box>
        <Card className={styles.formCard}>
          <Box gap="sm">
            <Text as="h2" variant="heading">
              Your journey starts here.
            </Text>
            <Text variant="small" tone="muted">
              New here or coming back? Enter the same email to find your
              progress.
            </Text>
          </Box>
          <form onSubmit={submit} className={styles.form}>
            <EmailField />
            {error && (
              <Text variant="small" tone="danger" role="alert">
                {error}
              </Text>
            )}
            <Button type="submit">
              Let&apos;s get started
              <Icon name="arrow" size="sm" />
            </Button>
          </form>
          <Box gap="sm" className={styles.privacy}>
            <Text variant="caption" tone="muted">
              This prototype stores your email and progress only in this
              browser. Email entry is not a verified login. Anyone using this
              browser could access a profile by entering its email.
            </Text>
            <Text variant="caption" tone="muted">
              Progress won&apos;t sync between devices and may be removed when
              browser data is cleared. We don&apos;t send your email or study
              answers to a server.
            </Text>
          </Box>
        </Card>
      </div>
      <Box direction="row" wrap justify="between" className={styles.footer}>
        <Text variant="caption" tone="muted">
          An independent study companion. Not an official SCDMV test.
        </Text>
        <ActionLink href={manualUrl(1)} target="_blank" rel="noreferrer">
          Read the official manual
          <Icon name="external" size="sm" />
        </ActionLink>
      </Box>
    </main>
  );
}
