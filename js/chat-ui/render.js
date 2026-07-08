// =====================================================================
// render.js — message bubble DOM rendering + repainting the active chat.
// =====================================================================
import { $ } from "../utils/dom.js";
import { getActiveChat } from "../chats/chatStore.js";
import { renderMarkdownish } from "./markdown.js";

export function appendMessageBubble(role, html, imageDataUrls = []) {
  const box = $("#messages");
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.innerHTML = html;
  (imageDataUrls || []).forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "attach";
    div.appendChild(img);
  });
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
  return div;
}

export function renderActiveChat() {
  const chat = getActiveChat();
  const box = $("#messages");
  box.innerHTML = "";
  if (!chat) {
    $("#chat-title").textContent = "No chat selected";
    return;
  }
  $("#chat-title").textContent = chat.title;
  $("#model-select").value = chat.model || "ne15";
  chat.messages.forEach((m) => appendMessageBubble(m.role, m.html ?? renderMarkdownish(m.content), m.imageDataUrls));
  box.scrollTop = box.scrollHeight;
}
