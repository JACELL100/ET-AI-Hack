# Chrome Web Store listing copy

## Name

RAKSHA AI Companion

## Short description

Quick access and voice control for the RAKSHA AI digital public-safety portal.

## Detailed description

RAKSHA AI Companion brings the RAKSHA AI citizen and admin safety tools into Chrome. Open SENTINEL scam analysis, NETRA currency verification, JAAL network intelligence, DRISHTI crime mapping, KAVACH citizen help, Phone Safety, and fraud reporting from one compact popup.

When you enable voice control, the companion can navigate the active RAKSHA portal and fill recognised fraud-report details. Sensitive actions such as submitting a report require an explicit confirmation.

You choose the RAKSHA portal address in the extension settings. The extension only interacts with the active tab after you invoke it and only if that tab belongs to that configured portal.

## Permission justifications

| Permission | Why it is needed |
| --- | --- |
| `activeTab` | Allows the user-invoked companion to communicate with the active configured RAKSHA page. |
| `scripting` | Injects the page bridge only after the user starts a voice command on the active RAKSHA page. |
| `storage` | Saves the user-selected portal address in Chrome Sync. |
| `audioCapture` | Enables microphone use for optional voice commands. |

## Store assets still required

- At least one real screenshot of the extension in use (1280×800 or 640×400 recommended).
- A 128×128 store icon; use `icons/icon-128.png`.
- A public, HTTPS privacy-policy page. Publish the text in `PRIVACY.md` on the RAKSHA website and link that page in the dashboard.
- Your support email and any category/contact information required by the Developer Dashboard.
