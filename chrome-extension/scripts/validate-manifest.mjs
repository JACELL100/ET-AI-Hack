import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, "manifest.json");
let manifest;
try { manifest = JSON.parse(readFileSync(manifestPath, "utf8")); }
catch (error) { throw new Error(`manifest.json is not valid JSON: ${error.message}`); }

if (manifest.manifest_version !== 3) throw new Error("manifest.json must use Manifest V3.");
if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(manifest.version || "")) throw new Error("manifest.version must be a valid Chrome version.");
for (const file of ["popup.html", "popup.js", "popup.css", "options.html", "options.js", "options.css", "content.js", "background.js", "icons/icon-16.png", "icons/icon-32.png", "icons/icon-48.png", "icons/icon-128.png"]) {
  if (!existsSync(resolve(root, file))) throw new Error(`Required extension file is missing: ${file}`);
}
for (const permission of ["activeTab", "audioCapture", "scripting", "storage"]) {
  if (!manifest.permissions?.includes(permission)) throw new Error(`Required permission is missing: ${permission}`);
}
console.log(`Manifest validation passed for ${manifest.name} v${manifest.version}.`);
