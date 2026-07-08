# NexusEcho — VortexLabs

A modular, single-page PWA that runs a real local LLM entirely in your browser
(via WebGPU), with cross-device sync stored in *your own* Google Drive or
OneDrive — no server, no paid API, and nothing of ours to maintain.

## Project structure

```
nexusecho/
├── index.html              entry point
├── manifest.json           PWA metadata
├── sw.js                   offline app-shell cache
├── css/                    one file per concern
│   ├── tokens.css          colors, fonts, radii (both themes)
│   ├── base.css            reset, buttons, fields
│   ├── gate.css            sign-in gate + banned screen
│   ├── shell.css           sidebar, model/tool controls, tabs
│   ├── chat.css            messages, composer, echo wave
│   ├── panels.css          Dev Hub / MCP / Downloads / Settings / Sync
│   └── responsive.css      breakpoints
├── assets/icons/           the 3 brand icon SVGs
└── js/
    ├── main.js              boots everything
    ├── config.js            ← the file you actually edit
    ├── utils/                dom.js, storage.js
    ├── auth/                 gate.js, strikes.js
    ├── theme/                theme.js, icons.js
    ├── chats/                chatStore.js (data), chatList.js (UI)
    ├── engine/               engine.js (WebLLM), systemPrompt.js
    ├── chat-ui/               render.js, markdown.js, mediaSanitizer.js,
    │                          echoWave.js, send.js
    ├── tools/                tools.js
    ├── sync/                 syncManager.js, googleDriveProvider.js,
    │                         oneDriveProvider.js
    └── panels/               tabs.js, devhub.js, mcp.js, downloads.js,
                               settings.js
```

Every file does one job and is small enough to read in a minute — that's the
whole point of splitting it up this way.

## A real constraint you should know about

Browsers refuse to load **external** JS module files (`<script type="module"
src="...">`) over `file://` — that's a CORS restriction Chrome/Edge/Firefox
all enforce, not a bug in this app. With this many files, **double-clicking
`index.html` on your hard drive will show a blank page with console errors.**

That's also true for cloud sync specifically, separately: Google/Microsoft's
sign-in flows require an `https://` (or `http://localhost`) page — they
don't accept `file://` at all.

So: **host it.** The good news is that costs nothing and takes five minutes —
see below.

## Setting up cloud sync (optional, free forever)

Cross-device sync needs a free, one-time "OAuth client ID" from Google
and/or Microsoft — a public identifier, not a secret, and not a paid API
key. This is the standard, TOS-compliant way any static site lets *your*
users read/write files in *their own* Drive/OneDrive without a backend.
Skip this section entirely and the app still works great locally.

**Google Drive** (stores one hidden file in the user's Drive "App Data"
folder — invisible in their normal file list, never touches their other
files):
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project (free).
2. APIs & Services → Library → enable **Google Drive API**.
3. APIs & Services → Credentials → **Create Credentials → OAuth client ID**
   → Application type **Web application**.
4. Under "Authorized JavaScript origins", add the URL you're hosting this
   on (e.g. `https://yourname.github.io`).
5. Copy the client ID into `GOOGLE_CLIENT_ID` in `js/config.js`.

**Microsoft OneDrive** (stores one file in the user's OneDrive "app folder",
same idea):
1. Go to [portal.azure.com](https://portal.azure.com) → **App registrations → New registration** (free).
2. Under **Authentication**, add a **Single-page application** platform with
   your hosted URL as the Redirect URI.
3. Under **API permissions**, add Microsoft Graph → Delegated →
   `Files.ReadWrite.AppFolder`.
4. Copy the **Application (client) ID** into `MS_CLIENT_ID` in `js/config.js`.

Once either ID is filled in, the corresponding button in Settings → Cloud
Sync actually works: it opens the provider's real sign-in popup, then reads
and writes a single `nexusecho-data.json` file that only this app can see.

**On GitHub as a sync backend:** intentionally not used. There's no way for
this app to look behind a GitHub login and find out which Google/Microsoft
account was originally used to create it — GitHub's API doesn't expose that.
Using the GitHub API itself as a data store (e.g. via a personal access
token) also means handling a real secret client-side, which isn't safe to
ship in a static site. Google Drive and OneDrive's app-folder pattern avoids
both problems, which is why those are the two sync options here.

## How to run this "forever," for free, until you stop it

Because there's no backend, "running" doesn't mean a process on your
computer that has to stay on — it means a static file sitting on a free
host, reachable any time. Here's the whole lifecycle:

### Turn it on
1. Create a free GitHub account if you don't have one.
2. Create a new repository (e.g. `nexusecho`), and upload every file in
   this `nexusecho/` folder into it, **keeping the folder structure intact**.
3. Repo → **Settings → Pages** → under "Build and deployment", set
   **Source: Deploy from a branch**, branch `main`, folder `/ (root)` → Save.
4. Wait about a minute, then open the URL GitHub shows you
   (`https://yourname.github.io/nexusecho/`).

That's it — the site now stays up permanently, for free, with nothing
running on your machine. Optionally, on your phone/desktop, open that URL
and use the browser's "Install app" / "Add to Home Screen" option so it
behaves like a normal installed app while still just being that same free,
static page.

### Turn it off
Whenever you want it to stop existing:
- **Take the site down but keep the code:** repo → Settings → Pages →
  set Source back to "None."
- **Delete it completely:** repo → Settings → scroll to "Danger Zone" →
  Delete this repository.

Either one is instant and, again, free — GitHub Pages has no usage-based
billing for a static site like this, so there's nothing to cancel or rack
up charges on either way.

## What's real vs. simulated (worth knowing before you rely on any of it)

- **Chat is real.** Model selection, streaming, tokens/sec, thinking mode,
  and tool calls genuinely run a small open-weight instruction model in the
  browser via WebLLM — the UI just never surfaces the underlying model name.
  If WebLLM's hosted model list changes, update the three `engineId` values
  in `js/config.js`.
- **Cloud sync is real** once you add a client ID (above) — it's a genuine
  OAuth flow into the user's own account, not a mock.
- **The sign-in gate is simulated.** No backend, so it only gates the UI.
- **The moderation/ban system is simulated on purpose.** A static site
  can't verify real identities or enforce a real IP ban, and a small local
  text model can't reliably classify images for illegal content — claiming
  otherwise would be misleading. What's here is a local strike counter as a
  UX demo of the flow you described; the banned screen says this plainly and
  points to real reporting channels (the platform involved, or NCMEC's
  CyberTipline for child-exploitation material) for anything genuinely illegal.
- **Knowledge Lookup is real** (Wikipedia's public REST API, no key needed).
- **Downloads tab wrappers are mock**, as requested — real native installers
  need Electron/Xcode/etc., which conflicts with the no-local-tools
  constraint. The SHA-256 hashes in the audit log are computed for real via
  `crypto.subtle`, just over placeholder data rather than a real binary.
