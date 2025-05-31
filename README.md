# Website Time Tracker – Firefox Extension

This Firefox extension tracks the total time you spend on each website and shows a ranked list from most to least visited, based on time. It helps you understand your browsing habits and manage your time online more effectively.

## 🔍 Features

- Tracks time spent on each website (per domain).
- Live-updating popup UI showing time rankings.
- Sorts sites by total time spent (HH:MM:SS format).
- Scrollable UI for many entries.
- Reset button to clear all tracked data.

## 🧱 Folder Structure

```
website-time-tracker/
├── background.js # Background script that monitors active tabs and updates time tracking
├── manifest.json # Extension manifest file (Manifest V2)
├── data.json # (Not used in current version — storage is in browser.storage.local)
└── popup/
├── popup.html # HTML structure of the popup UI
├── popup.css # Styling for the popup UI
└── popup.js # JavaScript logic for reading and displaying site times
```

## ⚙️ How It Works

1. **background.js** runs in the background and listens for tab activity or window focus changes.
2. It tracks the current active domain and the duration spent on it.
3. Time data is stored in `browser.storage.local.siteTimes`, and the currently active session is stored in `browser.storage.local.activeSession`.
4. **popup.js** reads this data every second, dynamically updating the UI to reflect live totals.

## 🧪 How to Install Locally (Temporary Add-On)

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`.
2. Click **"Load Temporary Add-on…"**
3. Select the `manifest.json` file from your extension folder.
4. You’ll now see a new extension icon in your toolbar.
5. Click the icon to see your time usage rankings.

## ♻️ Resetting Data

Click the **Reset** button in the popup to clear all stored time data and start fresh.

## 💡 Notes

- Works only while Firefox is running and the extension is active.
- Does not track time in incognito/private mode.
- Uses `browser.storage.local` for persistence between sessions.

## 📦 Future Improvements (Ideas)

- Export/import data.
- Set daily/weekly limits per site.
- Per-tab visualization.
- Dark mode toggle.
- Show total browsing time.

---

Made with ❤️ for productivity nerds.
