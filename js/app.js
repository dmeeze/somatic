/**
 * app.js — Entry point. Boot sequence, routing, wires everything together.
 */

import { getConfig } from './data/config.js';
import { applyTheme } from './utils/theme.js';
import { mountHome } from './screens/home.js';
import { mountSettings } from './screens/settings.js';
import { hide as hideCard } from './screens/card.js';

let config = getConfig();

function applyUIPrefs(prefs) {
  const sizes = { default: '16px', large: '19px', xlarge: '22px' };
  document.documentElement.style.fontSize = sizes[prefs.fontSize] || '16px';
  document.documentElement.classList.toggle('reduce-motion', !!prefs.reduceMotion);
}

function onConfigChange(newConfig) {
  config = newConfig;
  const theme = config.themes.find(t => t.id === config.activeThemeId) || config.themes[0];
  applyTheme(theme);
  applyUIPrefs(config.ui);
  mountHome(config, onConfigChange);
}

function boot() {
  const theme = config.themes.find(t => t.id === config.activeThemeId) || config.themes[0];
  applyTheme(theme);
  applyUIPrefs(config.ui);
  mountHome(config, onConfigChange);
  mountSettings(config, onConfigChange);
}

boot();

// ── Hash-based routing ────────────────────────────────────────────────────────

const SCREENS = ['home', 'card', 'settings'];

function navigate(hash) {
  let target = SCREENS.includes(hash) ? hash : 'home';
  // Card without content (e.g. direct URL load at #card) → go home
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
