import rawBank from "./questions.json";
import catalog from "./catalog.json";
import type { Question, Section, Mode, Attempt } from "../types";
import { selectQuestions } from "../lib/engine";

export const sections: Section[] = catalog.sections;
export const objectives = catalog.objectives;
export const source = catalog.source;
export const bankVersion = rawBank.bankVersion;
export const questions = rawBank.questions as Question[];
export const instructionalSections = sections.filter(
  (s) => s.type === "instructional",
);
export function createAttempt(mode: Mode, sectionId: string | null): Attempt {
  const section = sections.find((s) => s.id === sectionId);
  if (
    mode !== "comprehensive" &&
    (!section || section.type !== "instructional")
  )
    throw new Error("Choose a study section first.");
  const pool =
    mode === "comprehensive"
      ? questions
      : questions.filter((q) => q.sectionId === sectionId);
  const selected =
    mode === "practice"
      ? pool.map((q) => ({ ...q, choices: [...q.choices] }))
      : selectQuestions(
          pool,
          mode === "comprehensive"
            ? {
                count: 40,
                sectionQuotas: catalog.comprehensiveQuotas,
                requireImage: true,
              }
            : {
                count: section!.reviewCount,
                objectiveIds: section!.objectiveIds,
                requireImage: sectionId === "S06",
              },
        );
  return {
    id: crypto.randomUUID(),
    mode,
    sectionId: mode === "comprehensive" ? null : sectionId,
    questions: selected,
    answers: {},
    checked: [],
    cursor: 0,
    status: "in-progress",
    startedAt: new Date().toISOString(),
    bankVersion,
    sourceVersion: source.sourceId,
  };
}
export function manualUrl(pdfPage: number) {
  return source.url + `#page=${pdfPage}`;
}
