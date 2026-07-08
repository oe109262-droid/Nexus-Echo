// =====================================================================
// storage.js — localStorage helpers + the canonical key list.
// Keeping every key name in one place avoids typo bugs across modules.
// =====================================================================
export const LS = {
  session: "ne_session",
  theme: "ne_theme",
  icon: "ne_icon",
  chats: "ne_chats",
  activeChat: "ne_active_chat",
  strikes: "ne_strikes",
  banned: "ne_banned",
  noComments: "ne_no_comments",
  syncProvider: "ne_sync_provider",     // "google" | "microsoft" | null
  lastSyncedAt: "ne_last_synced_at",
};

export function readJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
