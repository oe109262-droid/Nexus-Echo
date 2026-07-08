// =====================================================================
// settings.js — Settings tab. Pulls together theme, icon, and sync UI
// initializers plus the settings that live only here.
// =====================================================================
import { $ } from "../utils/dom.js";
import { LS, readJSON, writeJSON } from "../utils/storage.js";
import { initThemeUI } from "../theme/theme.js";
import { initIconUI } from "../theme/icons.js";
import { initSyncUI } from "../sync/syncManager.js";

export function initSettings() {
  initThemeUI();
  initIconUI();
  initSyncUI();

  $("#no-comments-toggle").checked = readJSON(LS.noComments, false);
  $("#no-comments-toggle").addEventListener("change", (e) => writeJSON(LS.noComments, e.target.checked));

  $("#strike-display").textContent = readJSON(LS.strikes, 0);
  $("#reset-strikes-btn").addEventListener("click", () => {
    localStorage.removeItem(LS.strikes);
    $("#strike-display").textContent = 0;
  });

  $("#signout-btn").addEventListener("click", () => {
    sessionStorage.removeItem(LS.session);
    location.reload();
  });
}
