import type { ApiRoute } from "@/interviews/types";
import { createPool } from "@/server/concurrency";
import { compilePath, matchRoute, type CompiledRoute } from "@/server/router";
import { ensureController } from "@/server/serviceWorkerController";

let compiledRoutes: CompiledRoute[] = [];

const pool = createPool(5);

function mockDelay(): Promise<void> {
  const ms = 300 + (Math.random() * 400 - 200); // 100–500ms
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Registers the Service Worker and message listener.
 * Call once at app startup — resolves when the SW is controlling the page.
 */
export const initServer: Promise<void> = (async () => {
  if (!("serviceWorker" in navigator)) {
    console.warn("[codeflow] Service Workers not supported. Server will not work");
    return;
  }

  await ensureController();
  console.log("[codeflow] Server started");

  navigator.serviceWorker.addEventListener("message", async (event) => {
    if (event.data?.type !== "mock-api-request") return;

    const { method, url, body } = event.data;
    const parsed = new URL(url, location.origin);
    const matched = matchRoute(compiledRoutes, method, parsed.pathname);

    if (matched) {
      await pool.acquire();
      try {
        await mockDelay();
        const result = await matched.handler({
          params: matched.params,
          query: Object.fromEntries(parsed.searchParams),
          body,
        });
        event.ports[0].postMessage({ status: 200, body: result });
      } catch (err) {
        event.ports[0].postMessage({
          status: 500,
          body: { error: String(err) },
        });
      } finally {
        pool.release();
      }
    } else {
      event.ports[0].postMessage({
        status: 404,
        body: { error: `No handler for ${method} ${url}` },
      });
    }
  });
})();

/**
 * Replaces the active set of mock API routes.
 * Waits for the SW to be ready before resolving.
 */
export async function setupRoutes(apiRoutes: ApiRoute[]): Promise<void> {
  await initServer;
  compiledRoutes = apiRoutes.map((route) => ({
    method: route.method,
    regex: compilePath(route.path),
    handler: route.handler,
  }));
}
