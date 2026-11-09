# Study instrumentation

Instrumentation is local-only by default. No analytics endpoint, background sender, or remote logging service is configured. The app records opaque local profile IDs; it does not record emails, question text, or arbitrary page URLs in analytics events. An explicit context/data allowlist prevents those fields being accidentally attached.

## Event envelope

Every event has `schemaVersion: 1`, a unique `id`, a page `sessionId`, and an ISO UTC `occurredAt`. Context includes an opaque `profileId` and, where applicable, `attemptId`, `sectionId`, `mode`, `questionId`, `questionRevision`, `bankVersion`, and `sourceVersion`. A future backend can join answer IDs to the matching version of the question bank.

The schema is defined in `src/features/study/analytics/types.ts`.

| Event                                                             | When / useful data                                                                                                                                                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `question_viewed`                                                 | Question becomes visible, is revisited, or is shown after returning to the tab. A visit ID distinguishes genuine revisits. Strict Mode setup replay does not create a second view.      |
| `answer_selected`                                                 | Selection changes. Includes the answer ID and milliseconds since the latest view. Revisions of review answers each create an event.                                                     |
| `answer_checked`                                                  | A guided answer is checked. Includes answer ID, correctness and time since selection. Locked answers cannot produce a second check.                                                     |
| `question_completed`                                              | Guided check or final review submission. Includes the submitted answer ID (or null for unanswered), correctness and completion type. Review edits are not counted as completed answers. |
| `question_continued`                                              | Next, previous, jump or final submission. Includes next question ID, direction, time since view and time since guided feedback.                                                         |
| `practice_started` / `practice_finished`                          | A guided session starts / is finished.                                                                                                                                                  |
| `review_started` / `review_completed`                             | Section or comprehensive review starts / is submitted. Completion includes score, passing status, elapsed wall time and estimated active time.                                          |
| `review_cancelled`                                                | Comprehensive review is explicitly canceled. It does not create a completion, baseline or score.                                                                                        |
| `session_paused` / `session_resumed`                              | Leaving the session, switching profiles, backgrounding the page, or returning to it.                                                                                                    |
| `section_first_accessed`                                          | First observed access to a section for this profile.                                                                                                                                    |
| `section_practice_completed`                                      | All guided questions have been checked, including whether this is the section's first such completion.                                                                                  |
| `section_review_first_started` / `section_review_first_completed` | First section-review start and first submitted section review, even if that first review fails.                                                                                         |

Use `question_completed`, not `answer_selected`, to analyze commonly missed questions. Group by question ID **and revision** and distinguish guided practice from scored reviews. A user may intentionally change selections while reviewing. Canceled attempts are excluded from completed-review metrics.

## Durations and persistence

Question timing metadata is saved on each attempt; first section milestones are saved on the profile. Existing version-1 profiles continue to load. Known historical review/practice milestones are restored from existing attempt timestamps without retroactively generating events. Past section access and reading time cannot be reconstructed: first-access events mean first observed access after instrumentation was introduced.

Review `startedAt` and `completedAt` give wall-clock duration, including pauses. `activeMs` accumulates visible session intervals and excludes observed navigation/visibility pauses. It is an estimate: browser crashes and missing lifecycle events can lose the final interval. A new page session does not charge an old unfinished interval as active time. Per-visit events allow later analysis to split question-reading, selection and feedback time rather than treating an overnight pause as reading.

Events are retained in a separate local key, `sc-driver-prep:events:v1`, capped at the latest 1,000 events per browser. The queue records a dropped-event count. This is a prototype diagnostic buffer, not a permanent analytics warehouse. Attempt/milestone timestamps remain in saved study progress even after older event-log entries roll off. Storage failures fall back to memory and never prevent studying. You can inspect/export events via `studyAnalytics.read()` in development code or inspect the key in browser developer tools.

Clearing a profile's progress clears that profile's queued events and milestones; resetting all local data clears the queue. Existing completed scores remain unchanged when an unrelated unfinished review is canceled.

## Connecting a future endpoint

The transport interface accepts a batch of typed events and returns a promise. To opt into a future HTTPS collector, integrate this explicitly at the application boundary after deciding the collection/consent policy for teenage users:

```ts
import { studyAnalytics } from "@/features/study/analytics/client";
import { createHttpTransport } from "@/features/study/analytics/http-transport";

studyAnalytics.setTransport(
  createHttpTransport("https://your-collector.example/events"),
);
await studyAnalytics.flush();
```

This example is not called by the prototype. Do not put private collector credentials in client code. The HTTP adapter sends JSON with `credentials: "omit"`; the collector must support the app's origin and appropriate authorization/abuse controls.

`flush()` sends at most 50 queued events, removes them only after successful delivery, keeps failed batches for a later retry, and coalesces simultaneous flush calls. It does not start a timer or retry loop. A future integration can flush on an interval/online transition and supply its own backoff. Servers should deduplicate by event ID because a response can be lost after successful ingestion. If the local queue is full, older events can be dropped and the dropped count is observable through `studyAnalytics.status()`.

For production-grade durability or multiple simultaneous tabs, replace the local adapter with IndexedDB or a server-backed queue. The current buffer is scoped to one browser and does not promise cross-tab write coordination or cross-device identity.

Guided practice’s “Not sure; teach me!” emits `question_completed` with `completion: "practice-teach"`, `answerId: null`, and `correct: null`. It does not emit `answer_checked` or count toward right/wrong scores. Any earlier tentative selection remains an `answer_selected` event, but is removed from the saved answer. The completion timestamp records when teaching was revealed.
