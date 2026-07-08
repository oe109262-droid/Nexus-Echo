// =====================================================================
// tools.js — the only tool here that reaches the real internet is
// knowledge(): Wikipedia's public REST API, no key required. Everything
// else runs fully offline in the browser.
// =====================================================================
import { $$ } from "../utils/dom.js";
import { logDev } from "../panels/devhub.js";

export const Tools = {
  async knowledge(query) {
    logDev(`tool:knowledge → looking up "${query}"`, "info");
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.extract ? `${data.title}: ${data.extract}` : null;
    } catch {
      return null;
    }
  },

  calculator(expr) {
    if (!/^[0-9+\-*/().%\s]+$/.test(expr)) return null;
    try {
      return String(Function(`"use strict";return (${expr})`)());
    } catch {
      return null;
    }
  },
};

export function activeTools() {
  return $$(".tool-chip.active").map((b) => b.dataset.tool);
}

export function initToolChips() {
  $$(".tool-chip").forEach((chip) => chip.addEventListener("click", () => chip.classList.toggle("active")));
}

export async function maybeRunTools(userText) {
  const tools = activeTools();
  const results = [];

  const calc = userText.match(/calculate\s+([0-9+\-*/().%\s]+)/i);
  if (tools.includes("calculator") && calc) {
    const val = Tools.calculator(calc[1]);
    if (val !== null) results.push(`[Calculator] ${calc[1].trim()} = ${val}`);
  }

  const lookup =
    userText.match(/what is\s+(.+?)\??$/i) ||
    userText.match(/who is\s+(.+?)\??$/i) ||
    userText.match(/tell me about\s+(.+?)\??$/i);
  if (tools.includes("knowledge") && lookup) {
    const fact = await Tools.knowledge(lookup[1].trim());
    if (fact) results.push(`[Knowledge Lookup] ${fact}`);
  }

  return results;
}
