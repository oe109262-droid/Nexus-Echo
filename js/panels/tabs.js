// =====================================================================
// tabs.js — top-level tab navigation (Chat / Dev Hub / MCP / Downloads / Settings).
// =====================================================================
import { $$ } from "../utils/dom.js";

export function initTabs() {
  $$(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      $$(".tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === btn.dataset.tab));
    });
  });
}
