import type {
  EventContext,
  EventData,
  EventName,
  EventTransport,
  StudyEvent,
} from "./types.ts";
export const ANALYTICS_STORAGE_KEY = "sc-driver-prep:events:v1";
export const EVENT_LIMIT = 1000;
type StorageAdapter = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type Options = {
  storage?: () => StorageAdapter | undefined;
  now?: () => string;
  id?: () => string;
  maxEvents?: number;
};
const dataKeys: Record<EventName, string[]> = {
  question_viewed: ["visitId"],
  answer_selected: ["answerId", "sinceViewMs"],
  answer_checked: ["answerId", "correct", "sinceSelectionMs"],
  question_completed: ["answerId", "correct", "completion"],
  question_continued: [
    "nextQuestionId",
    "direction",
    "sinceViewMs",
    "sinceCheckMs",
  ],
  practice_started: ["questionCount"],
  practice_finished: ["elapsedMs", "activeMs"],
  review_started: ["questionCount"],
  review_completed: ["correct", "total", "passed", "elapsedMs", "activeMs"],
  review_cancelled: ["elapsedMs", "activeMs"],
  session_paused: ["reason"],
  session_resumed: ["questionCount"],
  section_first_accessed: [],
  section_practice_completed: ["first", "questionCount"],
  section_review_first_started: [],
  section_review_first_completed: ["passed"],
};
const eventNames = Object.keys(dataKeys) as EventName[];
function cleanContext(context: EventContext): EventContext {
  const {
    profileId,
    attemptId,
    sectionId,
    mode,
    questionId,
    questionRevision,
    bankVersion,
    sourceVersion,
  } = context;
  return {
    profileId,
    attemptId,
    sectionId,
    mode,
    questionId,
    questionRevision,
    bankVersion,
    sourceVersion,
  };
}
function cleanData(name: EventName, data: object) {
  return Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) =>
        dataKeys[name].includes(key) &&
        (value === null ||
          ["string", "number", "boolean"].includes(typeof value)),
    ),
  );
}
/** A local best-effort queue. Recording never sends network requests or throws into study flows. */
export function createAnalyticsClient(options: Options = {}) {
  const now = options.now ?? (() => new Date().toISOString());
  const id = options.id ?? (() => crypto.randomUUID());
  const storage =
    options.storage ??
    (() => (typeof window === "undefined" ? undefined : window.localStorage));
  const limit = Math.max(1, options.maxEvents ?? EVENT_LIMIT);
  let events: StudyEvent[] = [];
  let loaded = false;
  let sessionId: string | undefined;
  let dropped = 0;
  let persistenceAvailable = true;
  let lastError: string | null = null;
  let transport: EventTransport | undefined;
  let inFlight: Promise<boolean> | undefined;
  function load() {
    if (loaded) return;
    loaded = true;
    try {
      const raw = storage()?.getItem(ANALYTICS_STORAGE_KEY);
      if (!raw) return;
      const value = JSON.parse(raw);
      if (
        value.version !== 1 ||
        !Array.isArray(value.events) ||
        !value.events.every(
          (e: StudyEvent) =>
            e.schemaVersion === 1 &&
            typeof e.id === "string" &&
            typeof e.profileId === "string" &&
            typeof e.sessionId === "string" &&
            typeof e.occurredAt === "string" &&
            Number.isFinite(Date.parse(e.occurredAt)) &&
            eventNames.includes(e.name) &&
            typeof e.data === "object" &&
            e.data !== null,
        )
      )
        throw new Error("Invalid event queue");
      events = value.events.slice(-limit).map((e: StudyEvent) => ({
        ...cleanContext(e),
        schemaVersion: 1,
        id: e.id,
        sessionId: e.sessionId,
        occurredAt: e.occurredAt,
        name: e.name,
        data: cleanData(e.name, e.data),
      }));
      dropped =
        Math.max(0, Number(value.dropped) || 0) +
        Math.max(0, value.events.length - limit);
    } catch {
      persistenceAvailable = false;
      lastError = "Local event storage could not be read.";
    }
  }
  function persist() {
    try {
      storage()?.setItem(
        ANALYTICS_STORAGE_KEY,
        JSON.stringify({ version: 1, events, dropped }),
      );
      persistenceAvailable = true;
    } catch {
      persistenceAvailable = false;
      lastError = "Events are available in memory only.";
    }
  }
  function getSessionId() {
    return (sessionId ??= id());
  }
  return {
    getSessionId,
    record<Name extends EventName>(
      name: Name,
      context: EventContext,
      data: EventData[Name],
      occurredAt = now(),
    ) {
      try {
        load();
        const event = {
          ...cleanContext(context),
          schemaVersion: 1 as const,
          id: id(),
          sessionId: getSessionId(),
          occurredAt,
          name,
          data: cleanData(name, data),
        } as StudyEvent;
        events.push(event);
        if (events.length > limit) {
          dropped += events.length - limit;
          events = events.slice(-limit);
        }
        persist();
        return event.id;
      } catch {
        lastError = "An event could not be recorded.";
        return null;
      }
    },
    read() {
      load();
      return structuredClone(events);
    },
    status() {
      load();
      return {
        queued: events.length,
        dropped,
        persistenceAvailable,
        lastError,
      };
    },
    setTransport(next: EventTransport | undefined) {
      transport = next;
    },
    flush(): Promise<boolean> {
      load();
      if (inFlight) return inFlight;
      if (!transport || !events.length) return Promise.resolve(true);
      const batch = structuredClone(events.slice(0, 50));
      const send = transport;
      inFlight = (async () => {
        await Promise.resolve();
        try {
          await send(batch);
          const acknowledged = new Set(batch.map((e) => e.id));
          events = events.filter((e) => !acknowledged.has(e.id));
          lastError = null;
          persist();
          return true;
        } catch {
          lastError = "Event delivery failed; the batch remains queued.";
          return false;
        } finally {
          inFlight = undefined;
        }
      })();
      return inFlight;
    },
    clearProfile(profileId: string) {
      load();
      events = events.filter((e) => e.profileId !== profileId);
      persist();
    },
    clearAll() {
      load();
      events = [];
      dropped = 0;
      persist();
    },
  };
}
export const studyAnalytics = createAnalyticsClient();
