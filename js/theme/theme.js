// =====================================================================
// theme.js — System / Dark / Light theme switching.
// =====================================================================
import { $$ } from "../utils/dom.js";
import { LS, readJSON, writeJSON } from "../utils/storage.js";

export function applyTheme(choice) {
  const root = document.documentElement;
  if (choice === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = prefersDark ? "dark" : "light";
  } else {
    root.dataset.theme = choice;
  }
  writeJSON(LS.theme, choice);
  $$("#theme-segmented button").forEach((b) => b.classList.toggle("active", b.dataset.themeChoice === choice));
}

export function initThemeUI() {
  applyTheme(readJSON(LS.theme, "dark"));
  $$("#theme-segmented button").forEach((b) => b.addEventListener("click", () => applyTheme(b.dataset.themeChoice)));
}
