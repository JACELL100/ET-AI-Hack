const DEFAULT_BASE_URL = "http://localhost:3000";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const settings = await chrome.storage.sync.get("rakshaBaseUrl");
  if (!settings.rakshaBaseUrl) {
    await chrome.storage.sync.set({ rakshaBaseUrl: DEFAULT_BASE_URL });
  }

  // A deployed portal has a different address from the local development
  // default, so make the single required configuration step obvious.
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    await chrome.runtime.openOptionsPage();
  }
});
