// =====================================================================
// googleDriveProvider.js — real cross-device sync via the user's own
// Google Drive, using the "appDataFolder" special folder.
//
// Why appDataFolder: it's a hidden folder that ONLY this app can see —
// not the user's regular Drive files — so this can never read, list, or
// touch anything else in their Drive. This is Google's own documented,
// TOS-compliant pattern for exactly this use case, and it's free forever
// (well within Drive API's no-cost quota for a single small JSON file
// per user).
//
// Requires a free Google OAuth Client ID — see config.js.
// =====================================================================
import { GOOGLE_CLIENT_ID, SYNC_FILE_NAME } from "../config.js";
import { logDev } from "../panels/devhub.js";

const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;

function gisLoaded() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load Google Identity Services."));
    document.head.appendChild(s);
  });
}

async function ensureToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;
  await gisLoaded();
  if (!GOOGLE_CLIENT_ID) throw new Error("Google sync isn't configured yet — add GOOGLE_CLIENT_ID in js/config.js.");

  return new Promise((resolve, reject) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) return reject(new Error(resp.error));
        accessToken = resp.access_token;
        tokenExpiry = Date.now() + (resp.expires_in - 60) * 1000;
        resolve(accessToken);
      },
    });
    tokenClient.requestAccessToken({ prompt: "" });
  });
}

async function findFileId(token) {
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D%27${encodeURIComponent(SYNC_FILE_NAME)}%27&fields=files(id,name)`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive lookup failed (${res.status})`);
  const data = await res.json();
  return data.files?.[0]?.id || null;
}

async function createFile(token, payload) {
  const metadata = { name: SYNC_FILE_NAME, parents: ["appDataFolder"] };
  const boundary = "nexusecho_boundary";
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(payload)}\r\n--${boundary}--`;
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`Drive create failed (${res.status})`);
  return (await res.json()).id;
}

async function updateFile(token, fileId, payload) {
  const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Drive update failed (${res.status})`);
}

async function downloadFile(token, fileId) {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive download failed (${res.status})`);
  return res.json();
}

export const googleDriveProvider = {
  id: "google",
  label: "Google Drive",

  async connect() {
    await ensureToken();
    logDev("Google Drive connected (appDataFolder scope).", "success");
  },

  disconnect() {
    accessToken = null;
    tokenExpiry = 0;
  },

  isConnected() {
    return !!accessToken && Date.now() < tokenExpiry;
  },

  async push(payload) {
    const token = await ensureToken();
    const fileId = await findFileId(token);
    if (fileId) await updateFile(token, fileId, payload);
    else await createFile(token, payload);
    logDev("Synced to Google Drive.", "success");
  },

  async pull() {
    const token = await ensureToken();
    const fileId = await findFileId(token);
    if (!fileId) return null;
    return downloadFile(token, fileId);
  },
};
