// =====================================================================
// send.js — wires the composer: attachments, tool calls, streaming
// generation, and writing the result back into the chat store.
// =====================================================================
import { $, escapeHtml } from "../utils/dom.js";
import { getActiveChat, updateChat, createChat } from "../chats/chatStore.js";
import { renderChatList } from "../chats/chatList.js";
import { appendMessageBubble } from "./render.js";
import { renderMarkdownish, renderAssistantOutput } from "./markdown.js";
import { pulseEchoWave, restEchoWave } from "./echoWave.js";
import { maybeRunTools } from "../tools/tools.js";
import { ensureEngine, setChatStatus } from "../engine/engine.js";
import { buildSystemPrompt } from "../engine/systemPrompt.js";
import { registerStrike, heuristicFlag } from "../auth/strikes.js";
import { MODEL_MAP } from "../config.js";

let pendingImages = []; // { name, dataUrl }

export function clearAttachments() {
  pendingImages = [];
  $("#composer-attachments").innerHTML = "";
}

function renderAttachmentPreviews() {
  const box = $("#composer-attachments");
  box.innerHTML = "";
  pendingImages.forEach((img) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = `<img src="${img.dataUrl}" alt="${escapeHtml(img.name)}">`;
    box.appendChild(wrap);
  });
}

export function addImageFile(file) {
  if (heuristicFlag(file)) {
    registerStrike("flagged filename on upload");
    alert("This image was flagged by the local moderation check and cannot be sent. A strike has been recorded for this browser.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    pendingImages.push({ name: file.name, dataUrl: reader.result });
    renderAttachmentPreviews();
  };
  reader.readAsDataURL(file);
}

const GEN_PARAMS = {
  low: { max_tokens: 220, temperature: 0.6 },
  medium: { max_tokens: 500, temperature: 0.7 },
  high: { max_tokens: 900, temperature: 0.8 },
};

export async function handleSend(e) {
  e.preventDefault();
  const input = $("#composer-input");
  const text = input.value.trim();
  if (!text && pendingImages.length === 0) return;

  let chat = getActiveChat();
  if (!chat) chat = createChat($("#model-select").value);

  const imgs = pendingImages.map((i) => i.dataUrl);
  const newMessages = [...chat.messages, { role: "user", content: text, imageDataUrls: imgs }];
  const patch = { messages: newMessages };
  if (chat.messages.length === 0) patch.title = text.slice(0, 40) || "Image message";
  updateChat(chat.id, patch);
  chat = { ...chat, ...patch };

  appendMessageBubble("user", renderMarkdownish(text), imgs);
  input.value = "";
  clearAttachments();
  renderChatList();

  const modelKey = $("#model-select").value;
  updateChat(chat.id, { model: modelKey });

  const assistantDiv = appendMessageBubble("assistant", `<span class="typing">…</span>`);

  try {
    const tools = await maybeRunTools(text);
    const eng = await ensureEngine(modelKey);

    const history = chat.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    const systemPrompt =
      buildSystemPrompt() +
      (tools.length ? ` The following tool results are available — use them if relevant: ${tools.join(" | ")}` : "");

    const messages = [{ role: "system", content: systemPrompt }, ...history];

    const effort = $("#effort-select").value;
    const genParams = GEN_PARAMS[effort];

    setChatStatus("Streaming…");
    let full = "";
    let tokenCount = 0;
    const t0 = performance.now();

    const stream = await eng.chat.completions.create({
      messages,
      stream: true,
      temperature: genParams.temperature,
      max_tokens: genParams.max_tokens,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || "";
      if (!delta) continue;
      full += delta;
      tokenCount++;
      const elapsed = (performance.now() - t0) / 1000;
      $("#metric-tps").textContent = elapsed > 0 ? (tokenCount / elapsed).toFixed(1) : "—";
      $("#metric-tokens").textContent = tokenCount;
      pulseEchoWave();
      assistantDiv.innerHTML = renderAssistantOutput(full);
      $("#messages").scrollTop = $("#messages").scrollHeight;
    }

    restEchoWave();
    setChatStatus("Ready");
    const finalHtml = renderAssistantOutput(full);
    assistantDiv.innerHTML = finalHtml;
    updateChat(chat.id, { messages: [...chat.messages, { role: "assistant", content: full, html: finalHtml }] });
  } catch (err) {
    console.error(err);
    assistantDiv.className = "msg system-note";
    assistantDiv.textContent =
      err.message === "WebGPU unavailable"
        ? "This device/browser doesn't support WebGPU, so NexusEcho can't run a local model here. Try a recent desktop version of Chrome or Edge."
        : `Something went wrong loading or running the model: ${err.message}`;
    setChatStatus("Error");
  }
}

export function initComposer() {
  $("#composer").addEventListener("submit", handleSend);
  $("#composer-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $("#composer").requestSubmit();
    }
  });
  $("#composer-input").addEventListener("input", (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  });

  $("#attach-btn").addEventListener("click", () => $("#image-input").click());
  $("#image-input").addEventListener("change", (e) => {
    Array.from(e.target.files).forEach(addImageFile);
    e.target.value = "";
  });
  window.addEventListener("paste", (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    items.filter((i) => i.type.startsWith("image/")).forEach((i) => addImageFile(i.getAsFile()));
  });

  $("#model-select").addEventListener("change", () => {
    $("#metric-model").textContent = MODEL_MAP[$("#model-select").value].label;
  });
}
