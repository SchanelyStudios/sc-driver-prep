"use client";
import { useState } from "react";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Dialog } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { classes } from "@/lib/classes";
import { sections, instructionalSections } from "../data";
import { sectionStatus } from "../lib/engine";
import { studyActions } from "../lib/repository";
import type { Profile, View } from "../types";
const styles = {
  desktop:
    "sticky top-0 hidden h-dvh w-72 shrink-0 border-r border-line bg-surface lg:block",
  root: "h-full gap-0",
  logo: "px-6 pb-7 pt-8",
  logoMark:
    "flex size-10 items-center justify-center rounded-xl bg-brand text-surface",
  logoText: "font-bold tracking-tight",
  topNav: "px-4 pb-5",
  navButton:
    "flex min-h-11 w-full items-center justify-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
  selected: "bg-brand-soft text-brand",
  label: "px-7 pb-3",
  sectionNav: "flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 pb-5",
  sectionButton:
    "flex w-full items-start justify-start gap-3 rounded-xl px-3 py-2.5 text-left",
  number:
    "flex size-7 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-[11px] font-semibold text-muted",
  passed: "border-success/20 bg-success-soft text-success",
  failed: "border-danger/20 bg-danger-soft text-danger",
  itemTitle: "text-[12px] leading-4",
  itemStatus: "text-[10px] leading-4",
  footer: "border-t border-line px-6 py-5",
  email: "max-w-44 truncate",
  mobileBar:
    "flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden",
  close: "absolute right-2 top-4",
  resetBody: "pt-4",
};
function Navigation({
  profile,
  onNavigate,
}: {
  profile: Profile;
  onNavigate: (view: View) => void;
}) {
  const completed = instructionalSections.filter(
    (s) => sectionStatus(profile.attempts, s.id) === "Passed",
  ).length;
  return (
    <Box className={styles.root}>
      <Box direction="row" align="center" gap="sm" className={styles.logo}>
        <span className={styles.logoMark}>
          <Icon name="road" size="lg" />
        </span>
        <Box gap="none">
          <Text variant="subheading" className={styles.logoText}>
            SC Driver Prep
          </Text>
          <Text variant="caption" tone="muted">
            Your road to ready.
          </Text>
        </Box>
      </Box>
      <Box gap="xs" className={styles.topNav}>
        <Button
          variant="quiet"
          size="none"
          className={classes(
            styles.navButton,
            profile.view.screen === "dashboard" && styles.selected,
          )}
          aria-current={
            profile.view.screen === "dashboard" ? "page" : undefined
          }
          onClick={() => onNavigate({ screen: "dashboard" })}
        >
          <Icon name="grid" />
          My learning
        </Button>
      </Box>
      <Text variant="eyebrow" tone="muted" className={styles.label}>
        Your study guide
      </Text>
      <nav aria-label="Study sections" className={styles.sectionNav}>
        {sections.map((section) => {
          const status =
            section.type === "reference"
              ? "Reference"
              : sectionStatus(profile.attempts, section.id);
          const current =
            profile.view.screen === "section" &&
            profile.view.sectionId === section.id;
          return (
            <Button
              key={section.id}
              variant="quiet"
              size="none"
              className={classes(
                styles.sectionButton,
                current && styles.selected,
              )}
              aria-current={current ? "page" : undefined}
              onClick={() =>
                onNavigate({ screen: "section", sectionId: section.id })
              }
            >
              <span
                className={classes(
                  styles.number,
                  status === "Passed" && styles.passed,
                  status === "Not yet passed" && styles.failed,
                )}
              >
                {status === "Passed" ? (
                  <Icon name="check" size="sm" />
                ) : (
                  String(section.number).padStart(2, "0")
                )}
              </span>
              <Box gap="none">
                <Text as="span" variant="small" className={styles.itemTitle}>
                  {section.title}
                </Text>
                <Text
                  as="span"
                  variant="caption"
                  tone={status === "Passed" ? "success" : "muted"}
                  className={styles.itemStatus}
                >
                  {status}
                </Text>
              </Box>
            </Button>
          );
        })}
      </nav>
      <Box gap="sm" className={styles.footer}>
        <Box direction="row" justify="between">
          <Text variant="caption" tone="muted">
            Sections passed
          </Text>
          <Text variant="caption">{completed} / 11</Text>
        </Box>
        <Progress value={completed} max={11} label="Sections passed" />
        <Box direction="row" align="center" justify="between">
          <Box gap="none">
            <Text
              variant="caption"
              className={styles.email}
              title={profile.email}
            >
              {profile.email}
            </Text>
            <Text variant="caption" tone="muted">
              Saved on this browser
            </Text>
          </Box>
          <Button
            variant="quiet"
            size="icon"
            aria-label="Switch profile"
            onClick={studyActions.signOut}
          >
            <Icon name="user" />
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
export function Sidebar({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const navigate = (view: View) => {
    studyActions.navigate(view);
    setOpen(false);
  };
  return (
    <>
      <aside className={styles.desktop}>
        <Navigation profile={profile} onNavigate={navigate} />
      </aside>
      <div className={styles.mobileBar}>
        <Box direction="row" align="center" gap="sm">
          <Icon name="road" />
          <Text variant="subheading">SC Driver Prep</Text>
        </Box>
        <Button
          variant="quiet"
          size="icon"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
        >
          <Icon name="menu" />
        </Button>
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Study navigation"
        kind="drawer"
      >
        <Button
          variant="quiet"
          size="icon"
          className={styles.close}
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        >
          <Icon name="close" />
        </Button>
        <Navigation profile={profile} onNavigate={navigate} />
      </Dialog>
    </>
  );
}
