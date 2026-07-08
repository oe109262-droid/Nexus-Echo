// =====================================================================
// echoWave.js — the header waveform that pulses while a reply streams.
// Purely decorative signal-strength motif tying back to the app name.
// =====================================================================
import { $ } from "../utils/dom.js";

export function pulseEchoWave() {
  const path = $("#echo-wave-path");
  if (!path) return;
  let d = "M0,20 ";
  for (let x = 0; x <= 240; x += 12) {
    const y = 20 + Math.sin(x / 12 + performance.now() / 90) * (6 + Math.random() * 6);
    d += `L${x},${y.toFixed(1)} `;
  }
  path.setAttribute("d", d);
}

export function restEchoWave() {
  const path = $("#echo-wave-path");
  if (path) path.setAttribute("d", "M0,20 L240,20");
}
