// =====================================================================
// chatStore.js — pure data layer for chats. No DOM here on purpose,
// so chatList.js (rendering) and syncManager.js (cloud sync) can both
// depend on this without depending on each other.
// =====================================================================
import { uid } from "../utils/dom.js";
import { LS, readJSON, writeJSON } from "../utils/storage.js";
import { scheduleSync } from "../sync/syncManager.js";

export function loadChats() {
  return readJSON(LS.chats, []);
}

export function saveChats(chats, { sync = true } = {}) {
  writeJSON(LS.chats, chats);
  if (sync) scheduleSync();
}

export function createChat(defaultModel = "ne15") {
  const chats = loadChats();
  const chat = { id: uid(), title: "New chat", messages: [], model: defaultModel, createdAt: Date.now(), updatedAt: Date.now() };
  chats.unshift(chat);
  saveChats(chats);
  writeJSON(LS.activeChat, chat.id);
  return chat;
}

export function deleteChat(id) {
  const chats = loadChats().filter((c) => c.id !== id);
  saveChats(chats);
  if (readJSON(LS.activeChat, null) === id) {
    writeJSON(LS.activeChat, chats[0]?.id ?? null);
  }
}

export function updateChat(id, patch) {
  const chats = loadChats().map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c));
  saveChats(chats);
}

export function getActiveChat() {
  const chats = loadChats();
  const activeId = readJSON(LS.activeChat, null);
  return chats.find((c) => c.id === activeId) || chats[0] || null;
}

export function setActiveChat(id) {
  writeJSON(LS.activeChat, id);
}

// Merges a remote chat list into the local one, keeping whichever
// version of each chat (by id) has the newer updatedAt timestamp.
// This is intentionally simple last-write-wins per chat, not a full
// operational-transform merge — good enough for a personal chat log.
export function mergeRemoteChats(remoteChats) {
  if (!Array.isArray(remoteChats)) return loadChats();
  const local = loadChats();
  const byId = new Map(local.map((c) => [c.id, c]));
  remoteChats.forEach((rc) => {
    const lc = byId.get(rc.id);
    if (!lc || (rc.updatedAt || 0) > (lc.updatedAt || 0)) byId.set(rc.id, rc);
  });
  const merged = Array.from(byId.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  saveChats(merged, { sync: false }); // just merged FROM sync, don't immediately push back
  return merged;
}
