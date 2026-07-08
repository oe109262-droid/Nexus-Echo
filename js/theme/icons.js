// =====================================================================
// icons.js — brand icon picker. Icons are real files in assets/icons/,
// referenced by relative URL so this works over file:// or http(s).
// =====================================================================
import { $, $$ } from "../utils/dom.js";
import { LS, readJSON, writeJSON } from "../utils/storage.js";

const ICON_PATHS = {
  vortex: "assets/icons/vortex.svg",
  echo: "assets/icons/echo.svg",
  matrix: "assets/icons/matrix.svg",
};

export function applyIcon(choice) {
  writeJSON(LS.icon, choice);
  const path = ICON_PATHS[choice] || ICON_PATHS.vortex;
  $("#favicon")?.setAttribute("href", path);
  $$(".brand-mark").forEach((el) => { el.style.backgroundImage = `url('${path}')`; });
  $$("#icon-choices .icon-choice").forEach((b) => {
    b.classList.toggle("active", b.dataset.icon === choice);
    b.style.backgroundImage = `url('${ICON_PATHS[b.dataset.icon]}')`;
  });
}

export function initIconUI() {
  applyIcon(readJSON(LS.icon, "vortex"));
  $$("#icon-choices .icon-choice").forEach((b) => b.addEventListener("click", () => applyIcon(b.dataset.icon)));
}
