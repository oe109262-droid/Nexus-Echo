// =====================================================================
// downloads.js — Downloads tab. Platform cards are mock (real native
// installers need Electron/Xcode/etc., out of scope for a no-build
// static app), but the SHA-256 audit hashes are computed for real via
// crypto.subtle over a placeholder string.
// =====================================================================
import { $, nowStamp } from "../utils/dom.js";
import { PLATFORMS } from "../config.js";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function addAuditRow(platform, file, hash) {
  const tbody = $("#audit-body");
  const tr = document.createElement("tr");
  tr.innerHTML = `<td>${nowStamp()}</td><td>${platform}</td><td>${file}</td><td>${hash.slice(0, 16)}…</td>`;
  tbody.prepend(tr);
}

export function initDownloadsTab() {
  const grid = $("#downloads-grid");
  grid.innerHTML = "";
  PLATFORMS.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card dl-card";
    card.innerHTML = `<h4>${p.name}</h4><p>${p.note}</p><button class="btn btn-secondary btn-block" data-plat="${p.id}">Log ${p.file}</button>`;
    grid.appendChild(card);
  });
  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-plat]");
    if (!btn) return;
    const plat = PLATFORMS.find((p) => p.id === btn.dataset.plat);
    const hash = await sha256(plat.file + Date.now());
    addAuditRow(plat.name, plat.file, hash);
  });
}
