/**
 * app.js — Entry point. Boot sequence, routing, wires everything together.
 */

import { getConfig } from './data/config.js';
import { applyTheme } from './utils/theme.js';
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
