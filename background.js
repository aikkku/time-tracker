// background.js

// Keep track of the currently active domain (e.g. "example.com")
// and the timestamp (in ms) when it became active.
let currentDomain = null;
let lastActiveTimestamp = null;

// Utility: extract the domain (hostname) from a full URL string.
// Returns null if URL is invalid or not a web URL.
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// Whenever the user switches away from the currentDomain (via tab change, navigation,
// window blur, etc.), call this to compute how many milliseconds elapsed since
// lastActiveTimestamp, then add that amount (in seconds) to storage.
async function commitElapsedTime() {
  if (!currentDomain || lastActiveTimestamp === null) {
    return;
  }

  const now = Date.now();
  const deltaMs = now - lastActiveTimestamp;
  const deltaSec = Math.floor(deltaMs / 1000);

  if (deltaSec <= 0) {
    // Nothing to add.
    lastActiveTimestamp = now;
    return;
  }

  // Read the existing siteTimes object (or {})
  const { siteTimes = {} } = await browser.storage.local.get("siteTimes");
  const prevTotal = siteTimes[currentDomain] || 0;
  siteTimes[currentDomain] = prevTotal + deltaSec;

  // Write it back
  await browser.storage.local.set({ siteTimes });

  // Move the timestamp forward so we don't double-count
  lastActiveTimestamp = now;
}

// When a new domain becomes “active” (due to tab/window focus or navigation),
// we update currentDomain + lastActiveTimestamp, but only after flushing the old one.
function switchToDomain(newDomain) {
  // first commit whatever time is left on the old domain:
  commitElapsedTime();
  // now record the new domain
  if (newDomain) {
    currentDomain = newDomain;
    lastActiveTimestamp = Date.now();
  } else {
    // No valid domain (e.g. window lost focus, or no active tab), so clear both.
    currentDomain = null;
    lastActiveTimestamp = null;
  }
}

// On startup (or when the service worker wakes), figure out which tab is active now:
async function initializeCurrentDomain() {
  try {
    const [ windowInfo ] = await browser.windows.getAll({ populate: true, windowTypes: ["normal"] });
    // Find the focused window
    const focusedWindow = await browser.windows.getCurrent({ populate: true });
    if (!focusedWindow.focused) {
      // No focused window → nothing active
      switchToDomain(null);
      return;
    }

    const activeTab = focusedWindow.tabs.find((t) => t.active);
    if (activeTab && activeTab.url) {
      const domain = extractDomain(activeTab.url);
      switchToDomain(domain);
    } else {
      switchToDomain(null);
    }
  } catch (e) {
    // If something fails, just clear
    switchToDomain(null);
  }
}

// When the active tab changes (e.g. user clicks on a different tab in the same window):
browser.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Get the newly active tab object
    const tab = await browser.tabs.get(activeInfo.tabId);
    const domain = extractDomain(tab.url);
    switchToDomain(domain);
  } catch (e) {
    // If we can’t get the tab or URL, just clear
    switchToDomain(null);
  }
});

// If the URL of the current active tab changes (e.g. navigation within the same tab),
// we need to detect that and switch domains accordingly.
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only proceed if this tab is active and in the focused window AND the URL changed
  if (changeInfo.url && tab.active) {
    const domain = extractDomain(changeInfo.url);
    switchToDomain(domain);
  }
});

// When the user focuses or unfocuses a Firefox window.
// If windowId === browser.windows.WINDOW_ID_NONE (–1), browser lost focus entirely.
browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    // No window is focused now (user switched away from Firefox)
    switchToDomain(null);
    return;
  }

  // A Firefox window became focused—find its active tab to pick up the domain.
  try {
    const windowInfo = await browser.windows.get(windowId, { populate: true });
    if (!windowInfo.focused) {
      switchToDomain(null);
      return;
    }

    const activeTab = windowInfo.tabs.find((t) => t.active);
    if (activeTab) {
      const domain = extractDomain(activeTab.url);
      switchToDomain(domain);
    } else {
      switchToDomain(null);
    }
  } catch (e) {
    switchToDomain(null);
  }
});

// If the user closes a tab that was active, we should clear or switch to whatever is active next.
// “onRemoved” provides the tabId – if that was our active tab, we need to pick the new active tab.
browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // If the removed tab was active in a window, there's a new “active” tab now.
  // But onRemoved doesn’t say if it was active; so just re-query the focused window:
  const windows = await browser.windows.getAll({ populate: true, windowTypes: ["normal"] });
  const focusedWin = windows.find((w) => w.focused);
  if (!focusedWin) {
    switchToDomain(null);
    return;
  }
  const activeTab = focusedWin.tabs.find((t) => t.active);
  if (activeTab) {
    const domain = extractDomain(activeTab.url);
    switchToDomain(domain);
  } else {
    switchToDomain(null);
  }
});

// When the extension first loads (e.g. onInstalled or onStartup), initialize.
browser.runtime.onStartup.addListener(initializeCurrentDomain);
browser.runtime.onInstalled.addListener(initializeCurrentDomain);

// If the service worker wakes up (e.g. after being idle), re-init once:
initializeCurrentDomain();
