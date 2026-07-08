// =====================================================================
// oneDriveProvider.js — real cross-device sync via the user's own
// OneDrive, using Microsoft Graph's special "approot" app folder.
//
// Like Drive's appDataFolder, "approot" is a folder only this app can
// see — never the user's regular OneDrive files. This is Microsoft's
// own documented pattern for app-scoped storage, free forever within
// Graph API's standard no-cost usage.
//
// Requires a free Azure App Registration client ID — see config.js.
// =====================================================================
import { MS_CLIENT_ID, SYNC_FILE_NAME } from "../config.js";
import { logDev } from "../panels/devhub.js";

const SCOPES = ["Files.ReadWrite.AppFolder"];
let msalApp = null;
let account = null;

function msalLoaded() {
  return new Promise((resolve, reject) => {
    if (window.msal) return resolve();
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@azure/msal-browser@3/lib/msal-browser.min.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load Microsoft's sign-in library."));
    document.head.appendChild(s);
  });
}

async function ensureMsal() {
  if (msalApp) return msalApp;
  if (!MS_CLIENT_ID) throw new Error("Microsoft sync isn't configured yet — add MS_CLIENT_ID in js/config.js.");
  await msalLoaded();
  msalApp = new msal.PublicClientApplication({
    auth: { clientId: MS_CLIENT_ID, authority: "https://login.microsoftonline.com/consumers", redirectUri: location.href.split("#")[0] },
    cache: { cacheLocation: "localStorage" },
  });
  await msalApp.initialize();
  return msalApp;
}

async function ensureToken() {
  const app = await ensureMsal();
  const accounts = app.getAllAccounts();
  account = accounts[0] || account;
  try {
    if (account) {
      const res = await app.acquireTokenSilent({ scopes: SCOPES, account });
      return res.accessToken;
    }
  } catch { /* fall through to popup */ }
  const res = await app.loginPopup({ scopes: SCOPES });
  account = res.account;
  return res.accessToken;
}

const GRAPH_FILE = `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${SYNC_FILE_NAME}:/content`;

export const oneDriveProvider = {
  id: "microsoft",
  label: "Microsoft OneDrive",

  async connect() {
    await ensureToken();
    logDev("OneDrive connected (app folder scope).", "success");
  },

  disconnect() {
    account = null;
  },

  isConnected() {
    return !!account;
  },

  async push(payload) {
    const token = await ensureToken();
    const res = await fetch(GRAPH_FILE, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`OneDrive save failed (${res.status})`);
    logDev("Synced to OneDrive.", "success");
  },

  async pull() {
    const token = await ensureToken();
    const res = await fetch(GRAPH_FILE, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`OneDrive load failed (${res.status})`);
    return res.json();
  },
};
