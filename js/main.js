// =====================================================================
// main.js — the only file index.html loads directly. Boots the gate,
// then (once unlocked) every panel module.
// =====================================================================
import { $ } from "./utils/dom.js";
import { initGate } from "./auth/gate.js";
import { initTabs } from "./panels/tabs.js";
import { initDevHub, logDev } from "./panels/devhub.js";
import { initMcpTab } from "./panels/mcp.js";
import { initDownloadsTab } from "./panels/downloads.js";
import { initSettings } from "./panels/settings.js";
import { initToolChips } from "./tools/tools.js";
import { initChatListUI, renderChatList } from "./chats/chatList.js";
import { renderActiveChat } from "./chat-ui/render.js";
import { initComposer } from "./chat-ui/send.js";
import { MODEL_MAP } from "./config.js";

function bootApp() {
  initTabs();
  initDevHub();
  initMcpTab();
  initDownloadsTab();
  initSettings();      // also boots theme, icon, and cloud sync UI
  initToolChips();
  initComposer();
  initChatListUI();    // also creates a first chat if none exist

  // Whenever a cloud sync pull merges remote chats in, repaint the list.
  window.addEventListener("ne:synced", () => {
    renderChatList();
    renderActiveChat();
  });

  logDev("NexusEcho session started.", "success");
  logDev(
    navigator.gpu ? "WebGPU detected." : "WebGPU NOT detected — model loading will fail until you use a compatible browser.",
    navigator.gpu ? "success" : "warn"
  );
  $("#metric-backend").textContent = navigator.gpu ? "WebGPU (GPU-accelerated)" : "Unavailable — needs WebGPU";
  $("#metric-model").textContent = MODEL_MAP[$("#model-select").value].label;

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

document.addEventListener("DOMContentLoaded", () => initGate(bootApp));
