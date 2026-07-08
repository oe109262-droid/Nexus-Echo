// Minimal app-shell cache for offline use. Model weights (CDN) and sync
// calls (Google/Microsoft APIs) are intentionally NEVER cached or
// intercepted here — only same-origin app files are.
const CACHE = "nexusecho-shell-v2";

const SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/base.css",
  "./css/gate.css",
  "./css/shell.css",
  "./css/chat.css",
  "./css/panels.css",
  "./css/responsive.css",
  "./assets/icons/vortex.svg",
  "./assets/icons/echo.svg",
  "./assets/icons/matrix.svg",
  "./js/main.js",
  "./js/config.js",
  "./js/utils/dom.js",
  "./js/utils/storage.js",
  "./js/auth/gate.js",
  "./js/auth/strikes.js",
  "./js/theme/theme.js",
  "./js/theme/icons.js",
  "./js/chats/chatStore.js",
  "./js/chats/chatList.js",
  "./js/engine/engine.js",
  "./js/engine/systemPrompt.js",
  "./js/chat-ui/render.js",
  "./js/chat-ui/markdown.js",
  "./js/chat-ui/mediaSanitizer.js",
  "./js/chat-ui/echoWave.js",
  "./js/chat-ui/send.js",
  "./js/tools/tools.js",
  "./js/sync/syncManager.js",
  "./js/sync/googleDriveProvider.js",
  "./js/sync/oneDriveProvider.js",
  "./js/panels/tabs.js",
  "./js/panels/devhub.js",
  "./js/panels/mcp.js",
  "./js/panels/downloads.js",
  "./js/panels/settings.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return; // never intercept CDN/model/sync requests
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
