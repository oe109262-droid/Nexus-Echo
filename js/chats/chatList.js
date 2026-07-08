// =====================================================================
// chatList.js — sidebar chat list: rendering + click wiring.
// =====================================================================
import { $, $$, escapeHtml } from "../utils/dom.js";
import { LS, readJSON } from "../utils/storage.js";
import { loadChats, createChat, deleteChat, setActiveChat } from "./chatStore.js";
import { renderActiveChat } from "../chat-ui/render.js";

export function renderChatList() {
  const list = $("#chat-list");
  const chats = loadChats();
  const activeId = readJSON(LS.activeChat, null);
  list.innerHTML = "";

  if (chats.length === 0) {
    list.innerHTML = `<p style="color:var(--text-faint);font-size:12px;padding:8px;">No chats yet — start one below.</p>`;
    return;
  }

  chats.forEach((c) => {
    const item = document.createElement("div");
    item.className = "chat-item" + (c.id === activeId ? " active" : "");
    item.innerHTML = `<span class="title">${escapeHtml(c.title)}</span><button class="del" title="Delete">✕</button>`;
    item.addEventListener("click", (e) => {
      if (e.target.closest(".del")) return;
      setActiveChat(c.id);
      renderChatList();
      renderActiveChat();
    });
    item.querySelector(".del").addEventListener("click", () => {
      deleteChat(c.id);
      renderChatList();
      renderActiveChat();
    });
    list.appendChild(item);
  });
}

export function initChatListUI() {
  $("#new-chat-btn").addEventListener("click", () => {
    createChat($("#model-select").value);
    renderChatList();
    renderActiveChat();
  });

  if (loadChats().length === 0) createChat($("#model-select").value);
  renderChatList();
  renderActiveChat();
}
