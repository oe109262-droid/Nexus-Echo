// =====================================================================
// engine.js — loads @mlc-ai/web-llm from a CDN at runtime and manages a
// single active engine instance. No server, no API key: model weights
// come straight from WebLLM's own CDN cache into the browser.
// =====================================================================
import { $ } from "../utils/dom.js";
import { MODEL_MAP } from "../config.js";
import { logDev } from "../panels/devhub.js";

let webllmModule = null;
let engine = null;
let engineModelKey = null;

export function setChatStatus(text) {
  const el = $("#chat-status");
  if (el) el.textContent = text;
}

export async function ensureEngine(modelKey) {
  if (engine && engineModelKey === modelKey) return engine;

  if (!webllmModule) {
    logDev("Loading local execution runtime from CDN…", "info");
    webllmModule = await import("https://esm.run/@mlc-ai/web-llm");
  }

  if (!navigator.gpu) {
    $("#metric-backend").textContent = "Unavailable — needs WebGPU";
    logDev("✗ WebGPU is not available in this browser/device. NexusEcho needs a WebGPU-capable browser (recent Chrome/Edge) to run models locally.", "error");
    throw new Error("WebGPU unavailable");
  }
  $("#metric-backend").textContent = "WebGPU (GPU-accelerated)";

  const info = MODEL_MAP[modelKey];
  logDev(`Initializing ${info.label} (${info.tier} profile)…`, "info");
  setChatStatus(`Loading ${info.label}… this downloads model weights the first time and caches them.`);

  engine = new webllmModule.MLCEngine();
  engine.setInitProgressCallback((report) => {
    logDev(`init: ${report.text}`, "init");
    setChatStatus(report.text);
  });

  await engine.reload(info.engineId);
  engineModelKey = modelKey;

  logDev(`✓ ${info.label} ready.`, "success");
  setChatStatus("Ready");
  $("#metric-model").textContent = info.label;
  return engine;
}
