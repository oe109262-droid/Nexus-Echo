// =====================================================================
// gate.js — simulated sign-in gate. No real backend: this only decides
// whether to show the app shell. Calls onUnlock() once "signed in".
// =====================================================================
import { $, $$ } from "../utils/dom.js";
import { LS, readJSON, writeJSON } from "../utils/storage.js";

export function initGate(onUnlock) {
  const gate = $("#gate");
  const app = $("#app");
  const banned = $("#banned");

  if (readJSON(LS.banned, false)) {
    gate.hidden = true;
    banned.hidden = false;
    $("#banned-strike-count").textContent = readJSON(LS.strikes, 3);
    wireBannedReset();
    return;
  }

  if (sessionStorage.getItem(LS.session)) {
    gate.hidden = true;
    app.hidden = false;
    onUnlock();
    return;
  }

  $$(".gate-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".gate-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const name = tab.dataset.gatetab;
      $$(".gate-panel").forEach((p) => p.classList.toggle("active", p.dataset.gatepanel === name));
    });
  });

  $("#gate-email-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#gate-email").value.trim();
    const pass = $("#gate-pass").value;
    if (!email.includes("@") || pass.length < 4) {
      showGateError("Enter a valid email and a passphrase of at least 4 characters.");
      return;
    }
    sessionStorage.setItem(LS.session, JSON.stringify({ mode: "email", user: email, at: Date.now() }));
    unlock();
  });

  $$("[data-provider]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sessionStorage.setItem(LS.session, JSON.stringify({ mode: "oauth", provider: btn.dataset.provider, at: Date.now() }));
      unlock();
    });
  });

  $("#gate-guest-btn").addEventListener("click", () => {
    sessionStorage.setItem(LS.session, JSON.stringify({ mode: "guest", at: Date.now() }));
    unlock();
  });

  function unlock() {
    gate.hidden = true;
    app.hidden = false;
    onUnlock();
  }

  function showGateError(msg) {
    const el = $("#gate-error");
    el.textContent = msg;
    el.hidden = false;
  }

  wireBannedReset();
}

function wireBannedReset() {
  const btn = $("#banned-reset-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    localStorage.removeItem(LS.strikes);
    localStorage.removeItem(LS.banned);
    location.reload();
  });
}
