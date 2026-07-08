// =====================================================================
// config.js — every value you're likely to want to tweak lives here.
// =====================================================================

// ---------------------------------------------------------------------
// MODEL MAP — internal only. The UI never shows these ids or vendor
// names, just the "label". Swap the engineId any time WebLLM's
// prebuilt model list changes.
// ---------------------------------------------------------------------
export const MODEL_MAP = {
  ne1:  { label: "NexusEcho 1",   engineId: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", tier: "lightweight" },
  ne15: { label: "NexusEcho 1.5", engineId: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", tier: "balanced"    },
  ne2:  { label: "NexusEcho 2",   engineId: "Qwen2.5-3B-Instruct-q4f16_1-MLC",   tier: "premier"     },
};

// ---------------------------------------------------------------------
// SAFE MULTIMEDIA LINKS — only these hostnames are ever allowed through
// the chat's link sanitizer, and only over https.
// ---------------------------------------------------------------------
export const MEDIA_ALLOWLIST = [
  "open.spotify.com", "music.youtube.com", "www.youtube.com", "youtube.com",
  "youtu.be", "soundcloud.com", "www.soundcloud.com", "vimeo.com",
];

// ---------------------------------------------------------------------
// CLOUD SYNC — CLIENT IDS (public identifiers, not secrets, and free)
// ---------------------------------------------------------------------
// To turn on real cross-device sync you need to register a free OAuth
// client with Google and/or Microsoft. This is a one-time, no-cost
// setup step — there is no other way for a server-less static site to
// read/write files in *your users'* own Drive/OneDrive without it.
// See README.md > "Setting up cloud sync" for the exact steps.
//
//   1. Google Cloud Console → APIs & Services → Credentials
//      → "OAuth client ID" → Application type: Web application
//      → Authorized JavaScript origins: add the URL you host this on
//      (e.g. https://yourname.github.io)
//
//   2. Azure Portal → App registrations → New registration
//      → Redirect URI (SPA): the URL you host this on
//
// Paste the resulting IDs below. Leave them blank to keep sync disabled
// (the app works perfectly well locally without them).
export const GOOGLE_CLIENT_ID = ""; // e.g. "1234567890-abc.apps.googleusercontent.com"
export const MS_CLIENT_ID = "";     // e.g. "11111111-2222-3333-4444-555555555555"

// Both providers store exactly one hidden file — the app's own private
// data folder, invisible in the user's normal Drive/OneDrive file list —
// so this never touches or risks any of the user's other files.
export const SYNC_FILE_NAME = "nexusecho-data.json";

// ---------------------------------------------------------------------
// MCP TAB — default example config shown in the editor
// ---------------------------------------------------------------------
export const DEFAULT_MCP = {
  "$schema": "https://modelcontextprotocol.io/schema/mcp-server.json",
  "name": "nexusecho-local-tools",
  "version": "1.0.0",
  "description": "Example MCP server configuration for NexusEcho tool integrations.",
  "transport": { "type": "stdio", "command": "your-mcp-server-binary", "args": [] },
  "capabilities": { "tools": true, "resources": true, "prompts": false },
  "tools": [
    { "name": "knowledge_lookup", "description": "Fetches a short public summary for a topic." },
    { "name": "calculator", "description": "Evaluates a basic arithmetic expression." },
  ],
};

// ---------------------------------------------------------------------
// DOWNLOADS TAB — mock cross-platform wrappers
// ---------------------------------------------------------------------
export const PLATFORMS = [
  { id: "windows", name: "Windows", file: "NexusEcho-Setup.exe", note: "Download, then run the installer and allow it through SmartScreen if prompted." },
  { id: "macos",   name: "macOS",   file: "NexusEcho.dmg",       note: "Open the .dmg, drag NexusEcho into Applications, then right-click → Open on first launch." },
  { id: "linux",   name: "Linux",   file: "NexusEcho.AppImage",  note: "chmod +x the AppImage, then double-click or run it from a terminal." },
  { id: "ios",     name: "iOS",     file: "Add to Home Screen",  note: 'Open this site in Safari, tap Share, then "Add to Home Screen" to install as a PWA.' },
  { id: "android", name: "Android", file: "Add to Home Screen",  note: 'Open this site in Chrome, tap the menu, then "Install app" to add it as a PWA.' },
];
