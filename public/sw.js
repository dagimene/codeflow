/**
 * Generic mock API Service Worker.
 *
 * Intercepts fetch requests to /api/* and forwards them to the main thread
 * via MessageChannel. The main thread runs registered route handlers and
 * sends the response back through the channel port.
 *
 * This SW is challenge-agnostic — each challenge registers its own handlers.
 */

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleMockRequest(event));
  }
});

async function handleMockRequest(event) {
  const client = await self.clients.get(event.clientId);
  if (!client) {
    return new Response(JSON.stringify({ error: 'No client found' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body = null;
  try {
    const text = await event.request.text();
    if (text) body = JSON.parse(text);
  } catch (_) {
    // No body or non-JSON body
  }

  const { port1, port2 } = new MessageChannel();

  return new Promise((resolve) => {
    port1.onmessage = (e) => {
      resolve(
        new Response(JSON.stringify(e.data.body), {
          status: e.data.status || 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    };

    const reqUrl = new URL(event.request.url);
    client.postMessage(
      {
        type: 'mock-api-request',
        url: reqUrl.pathname + reqUrl.search,
        method: event.request.method,
        body: body,
      },
      [port2]
    );
  });
}

// Activate immediately and claim all clients so the SW is ready without a reload
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Allow the main thread to re-trigger claim (e.g. after unregister + re-register
// where activate doesn't fire again because the SW script hasn't changed).
self.addEventListener('message', (event) => {
  if (event.data?.type === 'claim') {
    self.clients.claim();
  }
});
