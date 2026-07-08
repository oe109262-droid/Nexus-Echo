// =====================================================================
// mcp.js — MCP Storage tab: edit and simulate an mcp-server.json config.
// =====================================================================
import { $ } from "../utils/dom.js";
import { DEFAULT_MCP } from "../config.js";
import { logDev } from "./devhub.js";

export function initMcpTab() {
  $("#mcp-json").value = JSON.stringify(DEFAULT_MCP, null, 2);

  $("#mcp-validate-btn").addEventListener("click", () => {
    try {
      JSON.parse($("#mcp-json").value);
      $("#mcp-status").textContent = "✓ Valid JSON.";
    } catch (e) {
      $("#mcp-status").textContent = "✗ Invalid JSON: " + e.message;
    }
  });

  $("#mcp-simulate-btn").addEventListener("click", () => {
    try {
      const cfg = JSON.parse($("#mcp-json").value);
      $("#mcp-status").textContent =
        `Simulated handshake with "${cfg.name || "unnamed-server"}"…\n` +
        `→ transport: ${cfg.transport?.type || "unknown"}\n` +
        `→ tools declared: ${(cfg.tools || []).length}\n` +
        `✓ Connection simulated locally (no real process was started).`;
      logDev(`MCP simulate: ${cfg.name}`, "info");
    } catch (e) {
      $("#mcp-status").textContent = "✗ Can't simulate — fix the JSON first: " + e.message;
    }
  });
}
