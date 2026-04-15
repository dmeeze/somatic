/**
 * layout.js — Detect and apply the current layout mode.
 *
 * Sets data-layout on <body> to one of:
 *   phone-portrait | phone-landscape | phone-landscape-compact |
 *   tablet-portrait | tablet-landscape
 *
 * CSS keys off body[data-layout="..."] selectors.
 */

/**
 * Compute the current layout mode from window dimensions.
 * @returns {string} layout mode name
 */
export function getLayoutMode() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isLandscape = w > h;

  if (isLandscape && h < 500) {
    // Landscape phone or similar. Compact when height < 380 (iOS Safari with chrome).
    return h < 380 ? 'phone-landscape-compact' : 'phone-landscape';
  }
  if (w > 900) return 'tablet-landscape';
  if (w > 500) return 'tablet-portrait';
  return 'phone-portrait';
}

/**
 * Read, compute, and apply the layout mode to <body>.
 * Returns the new mode string.
 * @returns {string}
 */
export function setLayoutMode() {
  const mode = getLayoutMode();
  document.body.setAttribute('data-layout', mode);
  return mode;
}
