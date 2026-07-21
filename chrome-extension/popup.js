const DEFAULT_BASE_URL = "http://localhost:3000";
const listenButton = document.getElementById("listen");
const status = document.getElementById("status");
const message = document.getElementById("message");
const baseInput = document.getElementById("site-url");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let listening = false;

function isLocalAddress(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".local") || /^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
}

function validateBase(value) {
  const source = String(value || "").trim() || DEFAULT_BASE_URL;
  try {
    const url = new URL(/^https?:\/\//i.test(source) ? source : `https://${source}`);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error();
    if (url.protocol !== "https:" && !isLocalAddress(url.hostname)) {
      return { error: "Use HTTPS for a deployed portal. HTTP is only allowed for local development." };
    }
    return { value: url.origin };
  } catch {
    return { error: "Enter a valid portal URL, such as https://portal.example.com." };
  }
}

async function getBaseUrl() {
  const { rakshaBaseUrl } = await chrome.storage.sync.get("rakshaBaseUrl");
  const result = validateBase(rakshaBaseUrl || baseInput.value);
  if (result.error) throw new Error(result.error);
  return result.value;
}

function update(text, state = "Ready") {
  message.textContent = text;
  status.textContent = state;
}

async function currentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isPortalTab(tab, base) {
  try { return Boolean(tab?.url) && new URL(tab.url).origin === new URL(base).origin; }
  catch { return false; }
}

async function openPath(path) {
  try {
    const base = await getBaseUrl();
    const url = `${base}${path}`;
    const tab = await currentTab();
    if (isPortalTab(tab, base) && tab?.id) await chrome.tabs.update(tab.id, { url });
    else await chrome.tabs.create({ url });
    window.close();
  } catch (error) {
    update(error.message || "Unable to open the portal.", "Check address");
  }
}

async function sendCommand(command) {
  const base = await getBaseUrl();
  const tab = await currentTab();
  if (!isPortalTab(tab, base) || !tab?.id) {
    await chrome.tabs.create({ url: base });
    throw new Error("The RAKSHA portal was opened in a new tab. Reopen the companion there, then try your command.");
  }
  try {
    return await chrome.tabs.sendMessage(tab.id, { type: "RAKSHA_VOICE_COMMAND", command, baseOrigin: new URL(base).origin });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    return chrome.tabs.sendMessage(tab.id, { type: "RAKSHA_VOICE_COMMAND", command, baseOrigin: new URL(base).origin });
  }
}

function initialiseRecognition() {
  if (!SpeechRecognition) {
    update("Voice recognition is unavailable here. Use a current Chrome or Edge browser.", "Unsupported");
    listenButton.disabled = true;
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = async (event) => {
    const command = event.results[event.results.length - 1][0].transcript;
    update(`Heard: “${command}”`, "Working");
    try {
      const response = await sendCommand(command);
      update(response?.message || "Command sent to RAKSHA.", "Done");
    } catch (error) {
      update(error.message || "Open the RAKSHA website in the active tab, then try again.", "Could not connect");
    }
  };
  recognition.onerror = (event) => update(`Microphone error: ${event.error}. Please allow microphone access.`, "Error");
  recognition.onend = () => {
    listening = false;
    listenButton.classList.remove("listening");
    listenButton.innerHTML = "<span>🎙</span> Start listening";
    if (status.textContent === "Listening") status.textContent = "Ready";
  };
}

listenButton.addEventListener("click", () => {
  if (!recognition) initialiseRecognition();
  if (!recognition || listening) return;
  listening = true;
  recognition.start();
  listenButton.classList.add("listening");
  listenButton.innerHTML = "<span>■</span> Listening…";
  update("Speak naturally. The extension will apply a supported RAKSHA command.", "Listening");
});

document.getElementById("save-site").addEventListener("click", async () => {
  const result = validateBase(baseInput.value);
  if (result.error) { update(result.error, "Check address"); return; }
  baseInput.value = result.value;
  await chrome.storage.sync.set({ rakshaBaseUrl: result.value });
  update("RAKSHA website address saved.", "Ready");
});
document.getElementById("open-home").addEventListener("click", () => openPath("/"));
document.getElementById("open-settings").addEventListener("click", () => chrome.runtime.openOptionsPage());
document.querySelectorAll("[data-path]").forEach((button) => button.addEventListener("click", () => openPath(button.dataset.path)));

chrome.storage.sync.get("rakshaBaseUrl").then(({ rakshaBaseUrl }) => {
  const result = validateBase(rakshaBaseUrl || DEFAULT_BASE_URL);
  baseInput.value = result.value || DEFAULT_BASE_URL;
});

initialiseRecognition();
