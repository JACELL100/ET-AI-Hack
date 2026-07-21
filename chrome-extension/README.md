# RAKSHA AI Companion Chrome extension

RAKSHA AI Companion is a Manifest V3 Chrome extension for the RAKSHA AI portal. It opens the citizen and admin modules, stores the deployed portal address in Chrome Sync, and sends speech-recognised commands to the active RAKSHA page.

## What is included

- Manifest V3 configuration and service worker
- Popup shortcuts for citizen and admin RAKSHA modules
- First-run settings page for a hosted portal URL
- Voice controls that only operate on the configured RAKSHA portal
- A confirmation flow for fraud-report submission
- Chrome Web Store-sized 16, 32, 48, and 128 pixel PNG icons
- A no-dependency validation and packaging workflow

## Configure and test locally

1. Start the RAKSHA frontend at `http://localhost:3000` (and the backend if the pages you test need it).
2. In Chrome, open `chrome://extensions`, turn on **Developer mode**, choose **Load unpacked**, and select this `chrome-extension` folder.
3. The settings page opens after installation. Leave `http://localhost:3000` for local development, or enter the HTTPS URL of your deployed frontend and select **Save settings**.
4. Pin **RAKSHA AI Companion**, open a RAKSHA page, then open the extension popup. Use a module shortcut or select **Start listening** and allow microphone access.

The extension intentionally uses `activeTab`: it reads or controls a page only after the user invokes the extension, and only when that page matches the configured RAKSHA portal address.

## Build the upload ZIP

The package contains no runtime npm dependencies. From this folder, run:

```powershell
npm run package
```

This regenerates the icons, validates the manifest, and creates a timestamped upload archive in `chrome-extension/dist/`. Upload that ZIP to the Chrome Web Store Developer Dashboard. Do not upload the whole repository or the unpacked directory as a ZIP.

## Deploy checklist

1. Deploy the RAKSHA frontend over HTTPS and ensure its backend/API environment variables point to your production backend.
2. Set that frontend URL in the extension settings; no extension rebuild is needed for a URL-only change.
3. Increment both `manifest.json` and `package.json` versions before every Chrome Web Store update.
4. Run `npm run icons` and `npm run package` again.
5. In the Developer Dashboard, upload the generated ZIP, use the copy in [WEB_STORE_LISTING.md](./WEB_STORE_LISTING.md), add screenshots, and provide a public privacy-policy URL based on [PRIVACY.md](./PRIVACY.md).

`localhost` and private-network HTTP URLs are supported only for development. A deployed portal must use HTTPS.
