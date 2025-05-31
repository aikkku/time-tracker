// popup/popup.js

// Helper: format seconds -> hh:mm:ss
function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [
    h.toString().padStart(2, '0'),
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0'),
  ].join(':');
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('ranking-container');
  const resetBtn = document.getElementById('reset-btn');

  // Load stored times under 'siteTimes' key
  browser.storage.local.get('siteTimes').then((result) => {
    // If undefined (first run), fall back to empty object
    const times = result.siteTimes || {};
    const entries = Object.entries(times);
    entries.sort((a, b) => b[1] - a[1]);

    // Render each row
    entries.forEach(([site, seconds]) => {
      const row = document.createElement('div');
      row.className = 'site-row';

      const name = document.createElement('div');
      name.className = 'site-name';
      name.textContent = site;

      const time = document.createElement('div');
      time.className = 'site-time';
      time.textContent = formatTime(seconds);

      row.appendChild(name);
      row.appendChild(time);
      container.appendChild(row);
    });

    // Placeholder if empty
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = 'No data yet.';
      empty.style.textAlign = 'center';
      empty.style.padding = '10px';
      container.appendChild(empty);
    }
  });

  // Reset handler
  resetBtn.addEventListener('click', () => {
    if (confirm('Clear all tracked times?')) {
      // Clear the key 'siteTimes'
      browser.storage.local.set({ siteTimes: {} }).then(() => {
        container.innerHTML = '';
        const empty = document.createElement('div');
        empty.textContent = 'No data yet.';
        empty.style.textAlign = 'center';
        empty.style.padding = '10px';
        container.appendChild(empty);
      });
    }
  });
});