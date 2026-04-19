/**
 * app.js — Entry point. Boot sequence, routing, wires everything together.
 */

import { getConfig, saveConfig } from './data/config.js';
import { applyTheme, deserializeTheme } from './utils/theme.js';
import { showConfirm, showSnackbar } from './ui/dialog.js';
import { setLayoutMode } from './utils/layout.js';
import { mountHome } from './screens/home.js';
import { mountSettings } from './screens/settings.js';
import { hide as hideCard } from './screens/card.js';

let config = getConfig();
let _currentLayoutMode = null;

function applyUIPrefs(prefs) {
  const sizes = { default: '16px', large: '19px', xlarge: '22px' };
  document.documentElement.style.fontSize = sizes[prefs.fontSize] || '16px';
  document.documentElement.classList.toggle('reduce-motion', !!prefs.reduceMotion);
}

function onConfigChange(newConfig) {
  config = newConfig;
  const theme = config.themes.find(t => t.id === config.activeThemeId) || config.themes[0];
  applyTheme(theme, config.urgencyLevels.length);
  applyUIPrefs(config.ui);
  mountHome(config, onConfigChange);
}

function boot() {
  _currentLayoutMode = setLayoutMode();
  const theme = config.themes.find(t => t.id === config.activeThemeId) || config.themes[0];
  applyTheme(theme, config.urgencyLevels.length);
  applyUIPrefs(config.ui);
  mountHome(config, onConfigChange);
  mountSettings(config, onConfigChange);
}

boot();
_handleThemeImport();

// ── Hash-based routing ────────────────────────────────────────────────────────

const SCREENS = ['home', 'card', 'settings'];

function navigate(hash) {
  let target = SCREENS.includes(hash) ? hash : 'home';
  if (target === 'card' && !document.getElementById('card').hasChildNodes()) {
    target = 'home';
    location.replace('#home');
  }
  SCREENS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', id === target);
  });
  if (target !== 'card') hideCard(false);
}

window.addEventListener('hashchange', () => navigate(location.hash.replace('#', '')));

const initial = location.hash.replace('#', '');
navigate(initial || 'home');
if (!location.hash) location.replace('#home');

// ── Theme import via ?import= URL param ──────────────────────────────────────

function _handleThemeImport() {
  const params = new URLSearchParams(window.location.search);
  const blob = params.get('import');
  if (!blob) return;

  // Remove param from URL immediately so refreshing doesn't re-trigger
  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete('import');
  history.replaceState({}, '', cleanUrl.toString());

  let theme;
  try {
    theme = deserializeTheme(blob);
  } catch {
    return;
  }

  showConfirm({
    title: `Import "${theme.name}"?`,
    message: 'This theme will be added to your custom themes and set as active.',
    confirmLabel: 'Import',
  }).then(ok => {
    if (!ok) return;
    theme.id = 'imported-' + Date.now();
    const newConfig = {
      ...config,
      themes: [...config.themes, theme],
      activeThemeId: theme.id,
    };
    if (theme.typography?.scale) {
      newConfig.ui = { ...newConfig.ui, fontSize: theme.typography.scale };
    }
    saveConfig(newConfig);
    onConfigChange(newConfig);
    mountSettings(newConfig, onConfigChange);
    showSnackbar(`Theme "${theme.name}" imported`);
  });
}

// ── Layout mode change detection ─────────────────────────────────────────────
// Remount home when layout mode changes (slider orientation and grid column
// count differ between modes — CSS alone cannot handle these).

let _resizeTimer;

function _onResize() {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    const newMode = setLayoutMode();
    if (newMode !== _currentLayoutMode) {
      _currentLayoutMode = newMode;
      mountHome(config, onConfigChange);
    }
  }, 100);
}

window.addEventListener('resize', _onResize);
window.addEventListener('orientationchange', () => {
  // orientationchange fires before dimensions settle; wait 200ms
  setTimeout(_onResize, 200);
});

// ── Update detection ──────────────────────────────────────────────────────────

let _swReg = null;

function _showUpdateBanner() {
  if (document.querySelector('.update-banner')) return;
  const banner = document.createElement('div');
  banner.className = 'update-banner';
  const msg = document.createElement('span');
  msg.textContent = 'Somatic has been updated.';
  const btn = document.createElement('button');
  btn.className = 'update-banner-btn';
  btn.textContent = 'Reload';
  btn.addEventListener('click', () => location.reload());
  banner.appendChild(msg);
  banner.appendChild(btn);
  document.body.appendChild(banner);
}

async function _checkVersion() {
  if (!navigator.onLine) return;
  try {
    const res = await fetch('./version.json?_=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const current = window.APP_VERSION;
    // Skip check in dev (unreplaced token) or if versions match
    if (!current || current === '__VERSION__' || !data.v || data.v === '__VERSION__') return;
    if (data.v !== current) {
      _swReg?.update().catch(() => {});
      _showUpdateBanner();
    }
  } catch {}
}

function _triggerUpdateCheck() {
  _checkVersion();
  _swReg?.update().catch(() => {});
}

// Check 3 s after boot and on various resume signals
setTimeout(_checkVersion, 3000);
window.addEventListener('online', _triggerUpdateCheck);
setInterval(_checkVersion, 10 * 60 * 1000);
// iOS PWA: app foregrounded from background (no navigation event fires)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') _triggerUpdateCheck();
});
// iOS Safari: page restored from BFCache
window.addEventListener('pageshow', e => {
  if (e.persisted) _triggerUpdateCheck();
});

// ── Service worker registration + update messaging ────────────────────────────

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(reg => { _swReg = reg; })
    .catch(() => {});

  // SW posts SW_UPDATED when a new version activates
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data?.type === 'SW_UPDATED') {
      const current = window.APP_VERSION;
      const incoming = e.data.version;
      // Only banner if both tokens are replaced (i.e. production builds)
      if (current && current !== '__VERSION__' && incoming && incoming !== '__VERSION__' && current !== incoming) {
        _showUpdateBanner();
      }
    }
  });
}
