// =====================================================================
// devhub.js — Dev Hub tab: live log + telemetry.
// logDev() is exported because almost every other module reports here.
// =====================================================================
import { $, escapeHtml, nowStamp } from "../utils/dom.js";

const LEVEL_COLOR = {
  info: "var(--text-dim)",
  success: "var(--echo)",
  warn: "var(--amber)",
  error: "var(--danger)",
  init: "var(--accent)",
};

export function logDev(msg, level = "info") {
  const log = $("#dev-log");
  if (!log) return;
  const line = document.createElement("div");
  line.className = "log-line";
  const color = LEVEL_COLOR[level] || "var(--text-dim)";
  line.innerHTML = `<span class="t">${nowStamp()}</span><span style="color:${color}">${escapeHtml(msg)}</span>`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

export function initDevHub() {
  $("#clear-log-btn").addEventListener("click", () => { $("#dev-log").innerHTML = ""; });
}
