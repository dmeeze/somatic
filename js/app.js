/**
 * app.js — Entry point. Boot sequence, routing, wires everything together.
 */

import { getConfig } from './data/config.js';
import { applyTheme } from './utils/theme.js';
import { mountHome } from './screens/home.js';
import { mountSettings } from './screens/settings.js';
import { hide as hideCard } from './screens/card.js';

const config = getConfig();

// Apply the active theme on boot
const activeTheme = config.themes.find(t => t.id === config.activeThemeId) || config.themes[0];
applyTheme(activeTheme);

// Mount screens
mountHome(config);
mountSettings();

// ── Hash-based routing ────────────────────────────────────────────────────────

const SCREENS = ['home', 'card', 'settings'];

function navigate(hash) {
  const target = SCREENS.includes(hash) ? hash : 'home';

  SCREENS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', id === target);
  });

  // If navigating away from card, ensure wake lock is released
  if (target !== 'card') {
    hideCard();
  }
}

window.addEventListener('hashchange', () => {
  navigate(location.hash.replace('#', ''));
});

// Resolve initial route
const initial = location.hash.replace('#', '');
navigate(initial || 'home');
if (!location.hash) location.replace('#home');
