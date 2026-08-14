# Kryptic Browser Control

This is a permission-first Manifest V3 extension for local Kryptic development. It can inspect the active page after the user clicks **Inspect page**, show a blue working overlay, scroll the page, request a **Take over** handoff, and let the user **Hand back** control.

## Install locally

Open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select this `extension/` directory. The extension uses `activeTab` and `scripting` rather than broad persistent page-control permissions. The local bridge is optional and runs at `http://127.0.0.1:8765`.

## Control contract

Kryptic starts idle. Inspection is explicit. The blue overlay indicates working state only; it is not permission to perform arbitrary actions. When the user clicks **Take over**, the extension marks the page as user-controlled and Kryptic must pause browser actions. When the user clicks **Hand back**, Kryptic may continue. Scroll requests are refused while the user has control.

The current extension intentionally does not submit forms, click arbitrary page controls, type credentials, or bypass CAPTCHAs. Those actions require a future explicit action schema and separate approval policy.

## Local bridge

From the Kryptic project root, run `node src/browser-bridge.js`. The extension sends takeover and hand-back events to the bridge. The bridge stores only a bounded in-memory event queue in this prototype; production use should add authentication, origin validation, and a stronger local IPC boundary.
