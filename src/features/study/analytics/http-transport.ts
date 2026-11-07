import type { EventTransport } from "./types.ts";
/** Future integration seam. Merely importing this factory sends nothing. */
export function createHttpTransport(
  endpoint: string,
  send: typeof fetch = fetch,
): EventTransport {
  const url = new URL(endpoint);
  if (url.protocol !== "https:")
    throw new Error("Analytics endpoints must use HTTPS.");
  return async (events) => {
    const response = await send(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({ schemaVersion: 1, events }),
    });
    if (!response.ok)
      throw new Error(`Analytics delivery failed (${response.status}).`);
  };
}
