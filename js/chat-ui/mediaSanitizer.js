// =====================================================================
// mediaSanitizer.js — only lets https links on an explicit allowlist of
// known media platforms through; strips everything else the model
// might emit, so no unsafe URL ever reaches the person.
// =====================================================================
import { MEDIA_ALLOWLIST } from "../config.js";

export function sanitizeMediaLinks(text) {
  return text.replace(/https?:\/\/[^\s)]+/g, (url) => {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:") return "[link removed: insecure protocol]";
      if (!MEDIA_ALLOWLIST.some((d) => u.hostname === d || u.hostname.endsWith("." + d))) {
        return "[link removed: untrusted domain]";
      }
      return `<a class="media-link" href="${url}" target="_blank" rel="noopener noreferrer">▶ ${u.hostname}</a>`;
    } catch {
      return "[link removed: unparseable]";
    }
  });
}
