// =====================================================================
// syncManager.js — orchestrates cross-device sync. Talks to whichever
// provider (Google Drive / OneDrive) the person connected, debounces
// pushes so typing doesn't spam the API, and merges on pull.
//
// To avoid a tight import cycle with chatStore.js, this module doesn't
// import the chat-list UI directly — after a pull+merge it dispatches a
// "ne:synced" event on window, and main.js re-renders in response.
// =====================================================================
import { $, $$ } from "../utils/dom.js";
import { LS, readJSON, writeJSON } from "../utils/storage.js";
import { GOOGLE_CLIENT_ID, MS_CLIENT_ID } from "../config.js";
import { googleDriveProvider } from "./googleDriveProvider.js";
import { oneDriveProvider } from "./oneDriveProvider.js";
import { logDev } from "../panels/devhub.js";

const PROVIDERS = { google: googleDriveProvider, microsoft: oneDriveProvider };
let activeProvider = null; // one of PROVIDERS values, or null
let debounceHandle = null;

function currentPayload() {
  return {
    chats: readJSON(LS.chats, []),
    settings: {
      theme: readJSON(LS.theme, "dark"),
      icon: readJSON(LS.icon, "vortex"),
      noComments: readJSON(LS.noComments, false),
    },
    syncedAt: Date.now(),
  };
}

async function pushNow() {
  if (!activeProvider) return;
  try {
    await activeProvider.push(currentPayload());
    writeJSON(LS.lastSyncedAt, Date.now());
    renderSyncStatus();
  } catch (err) {
    logDev(`Sync push failed: ${err.message}`, "error");
    renderSyncStatus(err.message);
  }
}

// Call this from anywhere data changes (e.g. chatStore.saveChats). Waits
// for a short quiet period so a burst of edits becomes one network call.
export function scheduleSync() {
  if (!activeProvider) return;
  clearTimeout(debounceHandle);
  debounceHandle = setTimeout(pushNow, 1500);
}

async function pullAndMerge() {
  if (!activeProvider) return;
  try {
    const remote = await activeProvider.pull();
    if (remote?.chats) {
      const { mergeRemoteChats } = await import("../chats/chatStore.js");
      mergeRemoteChats(remote.chats);
    }
    writeJSON(LS.lastSyncedAt, Date.now());
    renderSyncStatus();
    window.dispatchEvent(new CustomEvent("ne:synced"));
  } catch (err) {
    logDev(`Sync pull failed: ${err.message}`, "error");
    renderSyncStatus(err.message);
  }
}

function renderSyncStatus(errorMsg) {
  const status = $("#sync-status");
  if (!status) return;
  $$(".sync-provider-btn").forEach((b) => {
    const p = PROVIDERS[b.dataset.syncProvider];
    b.querySelector(".sync-dot")?.classList.toggle("connected", !!p?.isConnected());
    b.querySelector(".sync-btn-label").textContent = p?.isConnected() ? `${p.label} — connected` : `Connect ${p.label}`;
  });
  if (errorMsg) {
    status.textContent = `⚠ ${errorMsg}`;
    return;
  }
  const last = readJSON(LS.lastSyncedAt, null);
  status.textContent = activeProvider
    ? `Synced with ${activeProvider.label}${last ? " · last sync " + new Date(last).toLocaleTimeString() : ""}`
    : "Not connected — chats stay on this device only.";
}

async function connect(providerId) {
  const provider = PROVIDERS[providerId];
  const configured = providerId === "google" ? GOOGLE_CLIENT_ID : MS_CLIENT_ID;
  if (!configured) {
    renderSyncStatus(`${provider.label} sync isn't configured yet — add a client ID in js/config.js (see README).`);
    return;
  }
  try {
    await provider.connect();
    activeProvider = provider;
    writeJSON(LS.syncProvider, providerId);
    renderSyncStatus();
    await pullAndMerge();
    await pushNow();
  } catch (err) {
    logDev(`Sync connect failed: ${err.message}`, "error");
    renderSyncStatus(err.message);
  }
}

export function initSyncUI() {
  $$(".sync-provider-btn").forEach((btn) => {
    btn.addEventListener("click", () => connect(btn.dataset.syncProvider));
  });
  $("#sync-now-btn")?.addEventListener("click", async () => {
    await pullAndMerge();
    await pushNow();
  });
  $("#sync-disconnect-btn")?.addEventListener("click", () => {
    activeProvider?.disconnect();
    activeProvider = null;
    localStorage.removeItem(LS.syncProvider);
    renderSyncStatus();
  });

  // Reconnect silently isn't possible without a stored refresh token
  // (neither provider's browser SDK persists one across reloads by
  // design), so on load we just show the last-known provider as a
  // one-click reconnect rather than pretending we're still connected.
  const remembered = readJSON(LS.syncProvider, null);
  if (remembered && PROVIDERS[remembered]) {
    renderSyncStatus(`Reconnect to ${PROVIDERS[remembered].label} to resume syncing on this device.`);
  } else {
    renderSyncStatus();
  }
}
