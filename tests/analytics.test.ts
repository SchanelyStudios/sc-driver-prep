import test from "node:test";
import assert from "node:assert/strict";
import {
  createAnalyticsClient,
  ANALYTICS_STORAGE_KEY,
} from "../src/features/study/analytics/client.ts";
import { createHttpTransport } from "../src/features/study/analytics/http-transport.ts";
import type { StudyEvent } from "../src/features/study/analytics/types.ts";
function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}
const stamp = "2026-01-01T10:00:00.000Z";
function setup(maxEvents = 1000) {
  const store = storage();
  let counter = 0;
  const options = {
    storage: () => store,
    id: () => `event-${++counter}`,
    now: () => stamp,
    maxEvents,
  };
  return { store, options, client: createAnalyticsClient(options) };
}
test("instrumentation persists versioned IDs and timestamps and excludes unapproved context/payload fields", async () => {
  const { store, options, client } = setup();
  const context = {
    profileId: "opaque-user",
    questionId: "S05-Q27",
    questionRevision: 4,
    email: "private@example.com",
  };
  const data = { visitId: "visit", email: "private@example.com" };
  client.record("question_viewed", context, data);
  const serialized = store.getItem(ANALYTICS_STORAGE_KEY)!;
  assert.equal(serialized.includes("private@example.com"), false);
  const restored = createAnalyticsClient(options).read();
  assert.equal(restored[0].occurredAt, stamp);
  assert.equal(restored[0].schemaVersion, 1);
  assert.equal(restored[0].questionRevision, 4);
  assert.equal(await client.flush(), true); // No transport: no network and nothing discarded.
  assert.equal(client.read().length, 1);
});
test("bounded local queue reports dropped events instead of growing without limit", () => {
  const { client } = setup(2);
  for (let i = 0; i < 4; i++)
    client.record(
      "question_viewed",
      { profileId: "p" },
      { visitId: String(i) },
    );
  assert.equal(client.read().length, 2);
  assert.equal(client.status().dropped, 2);
  assert.equal(
    client.read()[0].data &&
      (client.read()[0].data as { visitId: string }).visitId,
    "2",
  );
});
test("storage failures preserve in-memory events without interrupting callers", () => {
  const client = createAnalyticsClient({
    storage: () => {
      throw new Error("Storage unavailable");
    },
  });
  assert.doesNotThrow(() =>
    client.record(
      "section_first_accessed",
      { profileId: "p", sectionId: "S01" },
      {},
    ),
  );
  assert.equal(client.read().length, 1);
  assert.equal(client.status().persistenceAvailable, false);
});
test("failed and synchronously throwing transports retain events and can be retried", async () => {
  const { client } = setup();
  client.record(
    "section_first_accessed",
    { profileId: "p", sectionId: "S01" },
    {},
  );
  client.setTransport(() => {
    throw new Error("Offline");
  });
  assert.equal(await client.flush(), false);
  assert.equal(client.read().length, 1);
  const sent: StudyEvent[] = [];
  client.setTransport(async (batch) => {
    sent.push(...batch);
  });
  assert.equal(await client.flush(), true);
  assert.equal(sent.length, 1);
  assert.equal(client.read().length, 0);
});
test("concurrent flushes share one batch and preserve new arrivals during delivery", async () => {
  const { client } = setup();
  client.record("section_first_accessed", { profileId: "p" }, {});
  let release!: () => void;
  let calls = 0;
  client.setTransport(async () => {
    calls++;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
  });
  const first = client.flush();
  const second = client.flush();
  assert.equal(first, second);
  await Promise.resolve();
  client.record("section_first_accessed", { profileId: "other" }, {});
  release();
  await first;
  assert.equal(calls, 1);
  assert.equal(client.read().length, 1);
  assert.equal(client.read()[0].profileId, "other");
});
test("profile reset removes only that profile's queued events", () => {
  const { client } = setup();
  for (const profileId of ["a", "b"])
    client.record("section_first_accessed", { profileId }, {});
  client.clearProfile("a");
  assert.deepEqual(
    client.read().map((e) => e.profileId),
    ["b"],
  );
  client.clearAll();
  assert.equal(client.read().length, 0);
});
test("future HTTP adapter is explicit, omits credentials, and checks delivery status", async () => {
  assert.throws(
    () => createHttpTransport("http://example.com/events"),
    /HTTPS/,
  );
  let init: RequestInit | undefined;
  const send = createHttpTransport("https://example.com/events", (async (
    _url,
    options,
  ) => {
    init = options;
    return new Response(null, { status: 204 });
  }) as typeof fetch);
  await send([]);
  assert.equal(init?.method, "POST");
  assert.equal(init?.credentials, "omit");
  const failing = createHttpTransport(
    "https://example.com/events",
    (async () => new Response(null, { status: 503 })) as typeof fetch,
  );
  await assert.rejects(failing([]), /503/);
});
