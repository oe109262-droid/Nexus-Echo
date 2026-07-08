// =====================================================================
// markdown.js — tiny, dependency-free formatting: fenced code blocks,
// inline code, line breaks — plus assembling the final assistant output
// (thinking block + sanitized body).
// =====================================================================
import { escapeHtml } from "../utils/dom.js";
import { sanitizeMediaLinks } from "./mediaSanitizer.js";

export function renderMarkdownish(text) {
  let out = escapeHtml(text);
  out = out.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code>${code}</code></pre>`);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\n/g, "<br>");
  return out;
}

export function renderAssistantOutput(raw) {
  let text = raw;
  let thinkHtml = "";
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i);
  if (thinkMatch) {
    thinkHtml = `<details class="think-block"><summary>Reasoning</summary>${renderMarkdownish(thinkMatch[1].trim())}</details>`;
    text = text.replace(thinkMatch[0], "").trim();
  }
  const body = sanitizeMediaLinks(renderMarkdownish(text));
  return thinkHtml + body;
}
