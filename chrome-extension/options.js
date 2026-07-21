const DEFAULT_BASE_URL = "http://localhost:3000";
const input = document.getElementById("site-url");
const result = document.getElementById("result");

function isLocalAddress(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname.endsWith(".local") || /^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
}

function validateBase(value) {
  const source = String(value || "").trim() || DEFAULT_BASE_URL;
  try {
    const url = new URL(/^https?:\/\//i.test(source) ? source : `https://${source}`);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error();
    if (url.protocol !== "https:" && !isLocalAddress(url.hostname)) return { error: "Use HTTPS for a deployed portal. HTTP is only allowed for local development." };
    return { value: url.origin };
  } catch { return { error: "Enter a valid portal URL, such as https://portal.example.com." }; }
}

function show(text, error = false) {
  result.textContent = text;
  result.style.color = error ? "#ff927d" : "#79e6bd";
}

async function save() {
  const checked = validateBase(input.value);
  if (checked.error) { show(checked.error, true); return null; }
  input.value = checked.value;
  await chrome.storage.sync.set({ rakshaBaseUrl: checked.value });
  show("Saved. The popup will now open this portal.");
  return checked.value;
}

document.getElementById("save").addEventListener("click", () => { void save(); });
document.getElementById("open").addEventListener("click", async () => {
  const base = await save();
  if (base) await chrome.tabs.create({ url: base });
});

chrome.storage.sync.get("rakshaBaseUrl").then(({ rakshaBaseUrl }) => {
  const checked = validateBase(rakshaBaseUrl || DEFAULT_BASE_URL);
  input.value = checked.value || DEFAULT_BASE_URL;
});
