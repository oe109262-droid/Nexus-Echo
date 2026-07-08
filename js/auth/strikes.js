// =====================================================================
// strikes.js — simulated moderation/ban flow.
//
// IMPORTANT — read before relying on this for anything real:
// This is a UX demo of the strike/ban flow you described, not a real
// trust & safety system. A static site with no backend cannot actually
// verify identities, track real accounts, or enforce a real IP ban —
// everything here lives in this browser's localStorage and resets the
// moment someone clears site data or opens a private window. A tiny
// local text model also has no reliable way to classify uploaded images
// for illegal content, so the "flag" below is a deliberately simple,
// generic filename heuristic — not image analysis. Anything genuinely
// illegal should be reported to the platform involved and, for child
// exploitation material, to NCMEC's CyberTipline — never handled
// through an app-level ban alone.
// =====================================================================
import { $ } from "../utils/dom.js";
import { LS, readJSON, writeJSON } from "../utils/storage.js";
import { logDev } from "../panels/devhub.js";

export function registerStrike(reason) {
  const strikes = readJSON(LS.strikes, 0) + 1;
  writeJSON(LS.strikes, strikes);
  logDev(`⚠ moderation flag recorded (${reason}) — strike ${strikes}/3`, "warn");

  const el = $("#strike-display");
  if (el) el.textContent = strikes;

  if (strikes >= 3) {
    writeJSON(LS.banned, true);
    sessionStorage.removeItem(LS.session);
    setTimeout(() => location.reload(), 600);
  }
  return strikes;
}

// Generic, non-invasive heuristic — flags obviously unsafe *filenames*,
// never pixel content (this app has no image-classification model).
export function heuristicFlag(file) {
  const bad = /(csam|cp|nsfw|explicit|gore)/i;
  return bad.test(file.name || "");
}
