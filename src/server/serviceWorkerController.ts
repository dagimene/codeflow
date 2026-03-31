/**
 * Registers the SW and ensures it controls this page.
 * If an existing-but-unregistered SW fails to claim within a short window,
 * it unregisters the stale registration and retries from scratch.
 */
export async function ensureController(): Promise<void> {
  if (navigator.serviceWorker.controller) return;

  const controllerChanged = new Promise<void>((resolve) => {
    navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
      once: true,
    });
  });

  const registration = await navigator.serviceWorker.register("/sw.js");

  // If the SW is already active but not controlling (e.g. after unregister +
  // re-register where activate doesn't re-fire), ask it to claim explicitly.
  if (registration.active && !navigator.serviceWorker.controller) {
    registration.active.postMessage({ type: "claim" });
  }

  // If the controller does not connect in 500ms, SW is likely stale. Unregister and retry.
  const result = await Promise.race([
    controllerChanged.then(() => "ok" as const),
    new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 500))
  ]);

  if (result === "timeout") {
    console.warn("[codeflow] Server initialization failed. Retrying...");
    await registration.unregister();
    return ensureController();
  }
}
