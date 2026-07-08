// =====================================================================
// dom.js — tiny shared DOM helpers. No dependencies.
// =====================================================================
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const uid = () => Math.random().toString(36).slice(2, 10);

export const nowStamp = () => new Date().toISOString().replace("T", " ").replace("Z", "");

export function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
