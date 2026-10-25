export type Mode = "practice" | "review" | "comprehensive";
export type Question = {
  id: string;
  sectionId: string;
  primaryObjectiveId: string;
  prompt: string;
  choices: { id: string; text: string }[];
  correctChoiceId: string;
  explanation: string;
  kind: "text" | "image";
  image?: { path: string; alt: string };
  source: {
    sourceId: string;
    heading: string;
    printedPages: string[];
    pdfStartPage: number;
    pdfEndPage: number;
    url: string;
  };
};
export type Section = {
  id: string;
  number: number;
  title: string;
  pdfStart: number;
  pdfEnd: number;
  type: string;
  reviewCount: number;
  objectiveIds: string[];
};
export type Attempt = {
  id: string;
  mode: Mode;
  sectionId: string | null;
  questions: Question[];
  answers: Record<string, string>;
  checked: string[];
  cursor: number;
  status: "in-progress" | "completed";
  startedAt: string;
  completedAt?: string;
  bankVersion: string;
  sourceVersion: string;
};
export type View =
  | { screen: "dashboard" }
  | { screen: "section"; sectionId: string }
  | { screen: "attempt"; attemptId: string };
export type Profile = {
  id: string;
  email: string;
  createdAt: string;
  attempts: Attempt[];
  view: View;
};
export type SavedData = {
  version: 1;
  activeProfileId: string | null;
  profiles: Profile[];
};
